import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class SalesService {
  // Crear venta (transacción)
  async createSale(saleData) {
    const { 
      cashDrawerId, 
      items,     // Array de { productId, cantidad, precioUnitario }
      subtotal, 
      tax, 
      total,
      paidAmount,
      change,
      paymentMethods  // Array de { metodo, monto, referencia }
    } = saleData;

    // Validar caja
    const cash = await executeQuery(
      'SELECT * FROM CashDrawer WHERE CashDrawerID = @cashDrawerId AND State = @state',
      { cashDrawerId, state: 'ABIERTA' }
    );

    if (cash.recordset.length === 0) {
      throw new AppError('Caja no encontrada o no está abierta', 404);
    }

    // Validar productos y stock
    for (const item of items) {
      const product = await executeQuery(
        'SELECT StockActual FROM Products WHERE ProductID = @productId',
        { productId: item.productId }
      );

      if (product.recordset.length === 0) {
        throw new AppError(`Producto ${item.productId} no encontrado`, 404);
      }

      if (product.recordset[0].StockActual < item.cantidad) {
        throw new AppError(
          `Stock insuficiente para producto ${item.productId}. Disponible: ${product.recordset[0].StockActual}`,
          400
        );
      }
    }

    try {
      // Iniciar transacción
      await executeQuery('BEGIN TRANSACTION');

      // 1. Insertar venta
      const saleResult = await executeQuery(
        `INSERT INTO Sales (CashDrawerID, UserID, FechaVenta, Subtotal, Tax, Total, PaidAmount, Change)
         VALUES (@cashDrawerId, @userId, GETDATE(), @subtotal, @tax, @total, @paidAmount, @change);
         SELECT SCOPE_IDENTITY() AS SaleID;`,
        {
          cashDrawerId,
          userId: saleData.userId,
          subtotal,
          tax,
          total,
          paidAmount,
          change
        }
      );

      const saleId = saleResult.recordset[0].SaleID;

      // 2. Insertar detalles de venta y actualizar stock
      for (const item of items) {
        // Insertar detalle
        await executeQuery(
          `INSERT INTO SaleDetails (SaleID, ProductID, Cantidad, PrecioUnitario, Subtotal)
           VALUES (@saleId, @productId, @cantidad, @precioUnitario, @subtotal)`,
          {
            saleId,
            productId: item.productId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario
          }
        );

        // Actualizar stock
        const currentProduct = await executeQuery(
          'SELECT StockActual FROM Products WHERE ProductID = @productId',
          { productId: item.productId }
        );

        const newStock = currentProduct.recordset[0].StockActual - item.cantidad;

        await executeQuery(
          `UPDATE Products 
           SET StockActual = @newStock, UpdatedAt = GETDATE()
           WHERE ProductID = @productId`,
          { newStock, productId: item.productId }
        );

        // Registrar en kardex
        await executeQuery(
          `INSERT INTO Kardex 
           (ProductID, TipoMovimiento, Cantidad, MotivoCambio, StockAnterior, StockActual, UserID)
           VALUES (@productId, 'VENTA', @cantidad, 'Venta', @oldStock, @newStock, @userId)`,
          {
            productId: item.productId,
            cantidad: item.cantidad,
            oldStock: currentProduct.recordset[0].StockActual,
            newStock,
            userId: saleData.userId
          }
        );
      }

      // 3. Registrar métodos de pago
      for (const payment of paymentMethods) {
        await executeQuery(
          `INSERT INTO PaymentMethods (SaleID, MetodoPago, Monto, ReferenciaPago)
           VALUES (@saleId, @metodo, @monto, @referencia)`,
          {
            saleId,
            metodo: payment.metodo,
            monto: payment.monto,
            referencia: payment.referencia || null
          }
        );
      }

      // 4. Actualizar montos en la caja
      await executeQuery(
        `UPDATE CashDrawer
         SET MontoEfectivo = MontoEfectivo + 
               COALESCE((SELECT SUM(Monto) FROM PaymentMethods WHERE SaleID = @saleId AND MetodoPago = 'EFECTIVO'), 0),
             MontoTarjeta = MontoTarjeta + 
               COALESCE((SELECT SUM(Monto) FROM PaymentMethods WHERE SaleID = @saleId AND MetodoPago = 'TARJETA'), 0),
             MontoQR = MontoQR + 
               COALESCE((SELECT SUM(Monto) FROM PaymentMethods WHERE SaleID = @saleId AND MetodoPago IN ('YAPE', 'PLIN')), 0)
         WHERE CashDrawerID = @cashDrawerId`,
        { saleId, cashDrawerId }
      );

      // Commit
      await executeQuery('COMMIT TRANSACTION');

      return {
        saleId,
        message: 'Venta registrada exitosamente'
      };
    } catch (error) {
      await executeQuery('ROLLBACK TRANSACTION');
      throw error;
    }
  }

  // Obtener venta con detalles
  async getSaleById(saleId) {
    const result = await executeQuery(
      `SELECT 
        s.*,
        u.FullName as Cajero
       FROM Sales s
       INNER JOIN Users u ON s.UserID = u.UserID
       WHERE s.SaleID = @saleId`,
      { saleId }
    );

    if (result.recordset.length === 0) {
      throw new AppError('Venta no encontrada', 404);
    }

    const sale = result.recordset[0];

    // Obtener detalles
    const details = await executeQuery(
      `SELECT sd.*, p.ProductName, p.Barcode
       FROM SaleDetails sd
       INNER JOIN Products p ON sd.ProductID = p.ProductID
       WHERE sd.SaleID = @saleId AND sd.IsDeleted = 0`,
      { saleId }
    );

    // Obtener métodos de pago
    const payments = await executeQuery(
      'SELECT * FROM PaymentMethods WHERE SaleID = @saleId',
      { saleId }
    );

    return {
      ...sale,
      detalles: details.recordset,
      metodosPago: payments.recordset
    };
  }

  // Listar ventas
  async listSales(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE 1=1';
    const params = { pageSize, offset: (page - 1) * pageSize };

    if (filters.cashDrawerId) {
      whereClause += ' AND s.CashDrawerID = @cashDrawerId';
      params.cashDrawerId = filters.cashDrawerId;
    }

    if (filters.userId) {
      whereClause += ' AND s.UserID = @userId';
      params.userId = filters.userId;
    }

    if (filters.state) {
      whereClause += ' AND s.State = @state';
      params.state = filters.state;
    }

    if (filters.fechaDesde) {
      whereClause += ' AND CAST(s.FechaVenta AS DATE) >= @fechaDesde';
      params.fechaDesde = filters.fechaDesde;
    }

    if (filters.fechaHasta) {
      whereClause += ' AND CAST(s.FechaVenta AS DATE) <= @fechaHasta';
      params.fechaHasta = filters.fechaHasta;
    }

    // Obtener total
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM Sales s ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos
    const result = await executeQuery(
      `SELECT 
        s.SaleID,
        s.FechaVenta,
        u.FullName as Cajero,
        s.Subtotal,
        s.Tax,
        s.Total,
        s.State,
        COUNT(sd.SaleDetailID) as TotalItems
       FROM Sales s
       INNER JOIN Users u ON s.UserID = u.UserID
       LEFT JOIN SaleDetails sd ON s.SaleID = sd.SaleID
       ${whereClause}
       GROUP BY s.SaleID, s.FechaVenta, u.FullName, s.Subtotal, s.Tax, s.Total, s.State
       ORDER BY s.FechaVenta DESC
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

  // Anular venta (solo Admin)
  async cancelSale(saleId, adminId) {
    const sale = await this.getSaleById(saleId);

    if (sale.State === 'ANULADA') {
      throw new AppError('La venta ya está anulada', 400);
    }

    try {
      // Iniciar transacción
      await executeQuery('BEGIN TRANSACTION');

      // 1. Actualizar estado de venta
      await executeQuery(
        `UPDATE Sales
         SET State = 'ANULADA', AnuladaEn = GETDATE(), AnuladaPor = @adminId
         WHERE SaleID = @saleId`,
        { saleId, adminId }
      );

      // 2. Revertir stock
      for (const detalle of sale.detalles) {
        const currentProduct = await executeQuery(
          'SELECT StockActual FROM Products WHERE ProductID = @productId',
          { productId: detalle.ProductID }
        );

        const newStock = currentProduct.recordset[0].StockActual + detalle.Cantidad;

        await executeQuery(
          `UPDATE Products 
           SET StockActual = @newStock, UpdatedAt = GETDATE()
           WHERE ProductID = @productId`,
          { newStock, productId: detalle.ProductID }
        );

        // Registrar en kardex la reversión
        await executeQuery(
          `INSERT INTO Kardex 
           (ProductID, TipoMovimiento, Cantidad, MotivoCambio, StockAnterior, StockActual, UserID)
           VALUES (@productId, 'DEVOLUCION', @cantidad, 'Anulación de venta', @oldStock, @newStock, @userId)`,
          {
            productId: detalle.ProductID,
            cantidad: detalle.Cantidad,
            oldStock: currentProduct.recordset[0].StockActual,
            newStock,
            userId: adminId
          }
        );
      }

      // Commit
      await executeQuery('COMMIT TRANSACTION');

      return {
        saleId,
        message: 'Venta anulada exitosamente'
      };
    } catch (error) {
      await executeQuery('ROLLBACK TRANSACTION');
      throw error;
    }
  }
}

export default new SalesService();
