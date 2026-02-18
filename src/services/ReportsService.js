import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class ReportsService {
  // Reporte de ventas por período
  async getSalesReport(filters = {}) {
    let whereClause = 'WHERE s.State = @state';
    const params = { state: 'COMPLETADA' };

    if (filters.fechaDesde) {
      whereClause += ' AND CAST(s.FechaVenta AS DATE) >= @fechaDesde';
      params.fechaDesde = filters.fechaDesde;
    }

    if (filters.fechaHasta) {
      whereClause += ' AND CAST(s.FechaVenta AS DATE) <= @fechaHasta';
      params.fechaHasta = filters.fechaHasta;
    }

    if (filters.userId) {
      whereClause += ' AND s.UserID = @userId';
      params.userId = filters.userId;
    }

    const result = await executeQuery(
      `SELECT 
        CAST(s.FechaVenta AS DATE) as Fecha,
        COUNT(s.SaleID) as TotalVentas,
        SUM(s.Subtotal) as Subtotal,
        SUM(s.Tax) as Impuestos,
        SUM(s.Total) as Total,
        SUM(CASE WHEN pm.MetodoPago = 'EFECTIVO' THEN pm.Monto ELSE 0 END) as TotalEfectivo,
        SUM(CASE WHEN pm.MetodoPago IN ('YAPE', 'PLIN') THEN pm.Monto ELSE 0 END) as TotalQR,
        SUM(CASE WHEN pm.MetodoPago = 'TARJETA' THEN pm.Monto ELSE 0 END) as TotalTarjeta
       FROM Sales s
       LEFT JOIN PaymentMethods pm ON s.SaleID = pm.SaleID
       ${whereClause}
       GROUP BY CAST(s.FechaVenta AS DATE)
       ORDER BY Fecha DESC`,
      params
    );

    return result.recordset;
  }

  // Productos más vendidos
  async getTopProducts(filters = {}) {
    let whereClause = 'WHERE s.State = @state';
    const params = { state: 'COMPLETADA' };
    const limit = filters.limit || 20;

    if (filters.fechaDesde) {
      whereClause += ' AND CAST(s.FechaVenta AS DATE) >= @fechaDesde';
      params.fechaDesde = filters.fechaDesde;
    }

    if (filters.fechaHasta) {
      whereClause += ' AND CAST(s.FechaVenta AS DATE) <= @fechaHasta';
      params.fechaHasta = filters.fechaHasta;
    }

    const result = await executeQuery(
      `SELECT TOP ${limit}
        p.ProductID,
        p.ProductName,
        p.Barcode,
        c.CategoryName,
        SUM(sd.Cantidad) as TotalVendido,
        SUM(sd.Subtotal) as MontoTotal,
        COUNT(DISTINCT s.SaleID) as VecesVendido,
        AVG(sd.PrecioUnitario) as PrecioPromedio
       FROM SaleDetails sd
       INNER JOIN Sales s ON sd.SaleID = s.SaleID
       INNER JOIN Products p ON sd.ProductID = p.ProductID
       INNER JOIN Categories c ON p.CategoryID = c.CategoryID
       ${whereClause}
       GROUP BY p.ProductID, p.ProductName, p.Barcode, c.CategoryName
       ORDER BY TotalVendido DESC`,
      params
    );

    return result.recordset;
  }

  // Reporte de caja
  async getCashReport(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = {};

    if (filters.fechaDesde) {
      whereClause += ' AND CAST(cd.FechaApertura AS DATE) >= @fechaDesde';
      params.fechaDesde = filters.fechaDesde;
    }

    if (filters.fechaHasta) {
      whereClause += ' AND CAST(cd.FechaApertura AS DATE) <= @fechaHasta';
      params.fechaHasta = filters.fechaHasta;
    }

    const result = await executeQuery(
      `SELECT 
        cd.CashDrawerID,
        u.FullName as Cajero,
        CAST(cd.FechaApertura AS DATE) as Fecha,
        cd.MontoInicial,
        cd.MontoEfectivo,
        cd.MontoTarjeta,
        cd.MontoQR,
        (cd.MontoEfectivo + cd.MontoTarjeta + cd.MontoQR) as MontoCierre,
        cd.Diferencia,
        CASE 
          WHEN cd.Diferencia = 0 THEN 'CUADRADO'
          WHEN cd.Diferencia > 0 THEN 'FALTANTE'
          ELSE 'SOBRANTE'
        END as Estado
       FROM CashDrawer cd
       INNER JOIN Users u ON cd.UserID = u.UserID
       ${whereClause}
       ORDER BY cd.FechaApertura DESC`,
      params
    );

    return result.recordset;
  }

  // Resumen ejecutivo
  async getExecutiveSummary(filters = {}) {
    const params = {};

    let dateFilter = '';
    if (filters.fechaDesde && filters.fechaHasta) {
      dateFilter = `AND CAST(s.FechaVenta AS DATE) >= @fechaDesde AND CAST(s.FechaVenta AS DATE) <= @fechaHasta`;
      params.fechaDesde = filters.fechaDesde;
      params.fechaHasta = filters.fechaHasta;
    }

    params.state = 'COMPLETADA';

    const result = await executeQuery(
      `SELECT 
        COUNT(DISTINCT s.SaleID) as TotalVentas,
        SUM(s.Total) as TotalVentasMoneda,
        SUM(s.Subtotal) as Subtotal,
        SUM(s.Tax) as TotalImpuestos,
        AVG(s.Total) as TicketPromedio,
        COUNT(DISTINCT s.UserID) as CajerosActivos,
        (SELECT COUNT(*) FROM Products WHERE IsActive = 1) as TotalProductos,
        (SELECT COUNT(*) FROM Products WHERE StockActual <= StockMinimo) as ProductosCriticos,
        (SELECT SUM(StockActual * CostPrice) FROM Products WHERE IsActive = 1) as InventarioValor
       FROM Sales s
       WHERE s.State = @state ${dateFilter}`,
      params
    );

    return result.recordset[0];
  }

  // Análisis de métodos de pago
  async getPaymentMethodsAnalysis(filters = {}) {
    const params = {};

    let dateFilter = '';
    if (filters.fechaDesde && filters.fechaHasta) {
      dateFilter = `AND CAST(s.FechaVenta AS DATE) >= @fechaDesde AND CAST(s.FechaVenta AS DATE) <= @fechaHasta`;
      params.fechaDesde = filters.fechaDesde;
      params.fechaHasta = filters.fechaHasta;
    }

    params.state = 'COMPLETADA';

    const result = await executeQuery(
      `SELECT 
        pm.MetodoPago,
        COUNT(DISTINCT s.SaleID) as TotalTransacciones,
        SUM(pm.Monto) as MontoTotal,
        AVG(pm.Monto) as MontoPromedio,
        MIN(pm.Monto) as MontoMinimo,
        MAX(pm.Monto) as MontoMaximo
       FROM PaymentMethods pm
       INNER JOIN Sales s ON pm.SaleID = s.SaleID
       WHERE s.State = @state ${dateFilter}
       GROUP BY pm.MetodoPago
       ORDER BY MontoTotal DESC`,
      params
    );

    return result.recordset;
  }

  // Alertas de inventario
  async getInventoryAlerts() {
    const result = await executeQuery(
      `SELECT 
        p.ProductID,
        p.Barcode,
        p.ProductName,
        c.CategoryName,
        p.StockActual,
        p.StockMinimo,
        (p.StockMinimo - p.StockActual) as FaltanUnidades,
        CASE 
          WHEN p.StockActual = 0 THEN 'AGOTADO'
          WHEN p.StockActual < p.StockMinimo THEN 'CRÍTICO'
          ELSE 'BAJO'
        END as Alerta
       FROM Products p
       INNER JOIN Categories c ON p.CategoryID = c.CategoryID
       WHERE p.StockActual <= p.StockMinimo AND p.IsActive = 1
       ORDER BY (p.StockMinimo - p.StockActual) DESC`
    );

    return result.recordset;
  }
}

export default new ReportsService();
