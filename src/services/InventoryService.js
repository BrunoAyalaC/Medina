import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class InventoryService {
  // Obtener inventario actual
  async getCurrentInventory(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE p.IsActive = 1';
    const params = { pageSize, offset: (page - 1) * pageSize };

    if (filters.categoryId) {
      whereClause += ' AND p.CategoryID = @categoryId';
      params.categoryId = filters.categoryId;
    }

    if (filters.searchTerm) {
      whereClause += ' AND (p.ProductName LIKE @search OR p.Barcode LIKE @search)';
      params.search = `%${filters.searchTerm}%`;
    }

    if (filters.stockCritico) {
      whereClause += ' AND p.StockActual <= p.StockMinimo';
    }

    // Obtener total de registros
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM Products p ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos paginados
    const result = await executeQuery(
      `SELECT 
        p.ProductID,
        p.Barcode,
        p.ProductName,
        c.CategoryName,
        p.CostPrice,
        p.SellingPrice,
        p.StockActual,
        p.StockMinimo,
        CASE 
          WHEN p.StockActual <= p.StockMinimo THEN 'CRÍTICO'
          WHEN p.StockActual <= (p.StockMinimo * 1.5) THEN 'BAJO'
          ELSE 'NORMAL'
        END AS StockStatus,
        p.CreatedAt,
        p.UpdatedAt
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      ${whereClause}
      ORDER BY p.ProductName ASC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      params
    );

    return {
      data: result.recordset,
      pagination: {
        total,
        pageSize,
        pageNumber: page,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // Registrar entrada de mercadería
  async registerEntrada(entradaData) {
    const { productId, cantidad, proveedor, userId, observaciones } = entradaData;

    // Validar que el producto exista
    const product = await executeQuery(
      'SELECT * FROM Products WHERE ProductID = @productId',
      { productId }
    );

    if (product.recordset.length === 0) {
      throw new AppError('Producto no encontrado', 404);
    }

    const prod = product.recordset[0];
    const stockAnterior = prod.StockActual;
    const stockActual = stockAnterior + cantidad;

    try {
      // Iniciar transacción
      await executeQuery('BEGIN TRANSACTION');

      // Actualizar stock del producto
      await executeQuery(
        `UPDATE Products 
         SET StockActual = @stockActual, UpdatedAt = GETDATE()
         WHERE ProductID = @productId`,
        { productId, stockActual }
      );

      // Registrar en kardex
      const result = await executeQuery(
        `INSERT INTO Kardex 
         (ProductID, TipoMovimiento, Cantidad, MotivoCambio, StockAnterior, StockActual, UserID, Proveedor, Observaciones)
         VALUES (@productId, 'ENTRADA', @cantidad, 'Compra', @stockAnterior, @stockActual, @userId, @proveedor, @observaciones);
         SELECT SCOPE_IDENTITY() AS KardexID;`,
        { 
          productId, 
          cantidad, 
          stockAnterior, 
          stockActual, 
          userId, 
          proveedor,
          observaciones 
        }
      );

      // Commit de la transacción
      await executeQuery('COMMIT TRANSACTION');

      return {
        kardexId: result.recordset[0].KardexID,
        productId,
        mensaje: 'Entrada registrada exitosamente'
      };
    } catch (error) {
      await executeQuery('ROLLBACK TRANSACTION');
      throw error;
    }
  }

  // Registrar salida de mercadería
  async registerSalida(salidaData) {
    const { productId, cantidad, motivo, responsable, userId, observaciones } = salidaData;

    // Validar que el producto exista
    const product = await executeQuery(
      'SELECT * FROM Products WHERE ProductID = @productId',
      { productId }
    );

    if (product.recordset.length === 0) {
      throw new AppError('Producto no encontrado', 404);
    }

    const prod = product.recordset[0];
    const stockAnterior = prod.StockActual;

    if (stockAnterior < cantidad) {
      throw new AppError(`Stock insuficiente. Disponible: ${stockAnterior}`, 400);
    }

    const stockActual = stockAnterior - cantidad;

    try {
      // Iniciar transacción
      await executeQuery('BEGIN TRANSACTION');

      // Actualizar stock del producto
      await executeQuery(
        `UPDATE Products 
         SET StockActual = @stockActual, UpdatedAt = GETDATE()
         WHERE ProductID = @productId`,
        { productId, stockActual }
      );

      // Registrar en kardex
      const result = await executeQuery(
        `INSERT INTO Kardex 
         (ProductID, TipoMovimiento, Cantidad, MotivoCambio, StockAnterior, StockActual, UserID, Responsable, Observaciones)
         VALUES (@productId, 'SALIDA', @cantidad, @motivo, @stockAnterior, @stockActual, @userId, @responsable, @observaciones);
         SELECT SCOPE_IDENTITY() AS KardexID;`,
        { 
          productId, 
          cantidad, 
          stockAnterior, 
          stockActual, 
          userId,
          motivo,
          responsable,
          observaciones 
        }
      );

      // Commit de la transacción
      await executeQuery('COMMIT TRANSACTION');

      return {
        kardexId: result.recordset[0].KardexID,
        productId,
        mensaje: 'Salida registrada exitosamente'
      };
    } catch (error) {
      await executeQuery('ROLLBACK TRANSACTION');
      throw error;
    }
  }

  // Obtener historial de movimientos (kardex)
  async getKardexHistory(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE 1=1';
    const params = { pageSize, offset: (page - 1) * pageSize };

    if (filters.productId) {
      whereClause += ' AND k.ProductID = @productId';
      params.productId = filters.productId;
    }

    if (filters.tipoMovimiento) {
      whereClause += ' AND k.TipoMovimiento = @tipoMovimiento';
      params.tipoMovimiento = filters.tipoMovimiento;
    }

    if (filters.fechaDesde) {
      whereClause += ' AND k.CreatedAt >= @fechaDesde';
      params.fechaDesde = filters.fechaDesde;
    }

    if (filters.fechaHasta) {
      whereClause += ' AND k.CreatedAt <= @fechaHasta';
      params.fechaHasta = filters.fechaHasta;
    }

    // Obtener total
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM Kardex k ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos
    const result = await executeQuery(
      `SELECT 
        k.KardexID,
        k.ProductID,
        p.ProductName,
        p.Barcode,
        k.TipoMovimiento,
        k.Cantidad,
        k.MotivoCambio,
        k.StockAnterior,
        k.StockActual,
        u.FullName as Usuario,
        k.Proveedor,
        k.Responsable,
        k.CreatedAt,
        k.Observaciones
      FROM Kardex k
      INNER JOIN Products p ON k.ProductID = p.ProductID
      INNER JOIN Users u ON k.UserID = u.UserID
      ${whereClause}
      ORDER BY k.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      params
    );

    return {
      data: result.recordset,
      pagination: {
        total,
        pageSize,
        pageNumber: page,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // Obtener productos con stock crítico
  async getStockCritico() {
    const result = await executeQuery(
      `SELECT 
        p.ProductID,
        p.Barcode,
        p.ProductName,
        c.CategoryName,
        p.StockActual,
        p.StockMinimo,
        (p.StockMinimo - p.StockActual) as FaltanUnidades
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.StockActual <= p.StockMinimo AND p.IsActive = 1
      ORDER BY (p.StockMinimo - p.StockActual) DESC`
    );

    return result.recordset;
  }

  // Obtener valor total de inventario (FIFO)
  async getInventoryValue() {
    const result = await executeQuery(
      `SELECT 
        SUM(p.StockActual * p.CostPrice) as CostoTotal,
        SUM(p.StockActual * p.SellingPrice) as ValorVenta,
        COUNT(*) as TotalProductos,
        SUM(p.StockActual) as TotalUnidades
      FROM Products p
      WHERE p.IsActive = 1`
    );

    return result.recordset[0];
  }
}

export default new InventoryService();
