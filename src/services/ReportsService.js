import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class ReportsService {
  // Reporte de ventas por período
  async getSalesReport(filters = {}) {
    let whereClause = 'WHERE s.state = ?';
    const params = ['COMPLETADA'];

    if (filters.fechaDesde) {
      whereClause += ' AND DATE(s.fecha_venta) >= ?';
      params.push(filters.fechaDesde);
    }

    if (filters.fechaHasta) {
      whereClause += ' AND DATE(s.fecha_venta) <= ?';
      params.push(filters.fechaHasta);
    }

    if (filters.userId) {
      whereClause += ' AND s.user_id = ?';
      params.push(filters.userId);
    }

    const result = await executeQuery(
      `SELECT 
        DATE(s.fecha_venta) as fecha,
        COUNT(s.sale_id) as total_ventas,
        SUM(s.subtotal) as subtotal,
        SUM(s.tax) as impuestos,
        SUM(s.total) as total,
        SUM(CASE WHEN pm.metodo_pago = 'EFECTIVO' THEN pm.monto ELSE 0 END) as total_efectivo,
        SUM(CASE WHEN pm.metodo_pago IN ('YAPE', 'PLIN') THEN pm.monto ELSE 0 END) as total_qr,
        SUM(CASE WHEN pm.metodo_pago = 'TARJETA' THEN pm.monto ELSE 0 END) as total_tarjeta
       FROM sales s
       LEFT JOIN payment_methods pm ON s.sale_id = pm.sale_id
       ${whereClause}
       GROUP BY DATE(s.fecha_venta)
       ORDER BY fecha DESC`,
      params
    );

    return result.recordset;
  }

  // Productos más vendidos
  async getTopProducts(filters = {}) {
    let whereClause = 'WHERE s.state = ?';
    const params = ['COMPLETADA'];
    const limit = filters.limit || 20;

    if (filters.fechaDesde) {
      whereClause += ' AND DATE(s.fecha_venta) >= ?';
      params.push(filters.fechaDesde);
    }

    if (filters.fechaHasta) {
      whereClause += ' AND DATE(s.fecha_venta) <= ?';
      params.push(filters.fechaHasta);
    }

    const result = await executeQuery(
      `SELECT 
        p.product_id,
        p.product_name,
        p.barcode,
        c.category_name,
        SUM(sd.cantidad) as total_vendido,
        SUM(sd.subtotal) as monto_total,
        COUNT(DISTINCT s.sale_id) as veces_vendido,
        AVG(sd.precio_unitario) as precio_promedio
       FROM sale_details sd
       INNER JOIN sales s ON sd.sale_id = s.sale_id
       INNER JOIN products p ON sd.product_id = p.product_id
       INNER JOIN categories c ON p.category_id = c.category_id
       ${whereClause}
       GROUP BY p.product_id, p.product_name, p.barcode, c.category_name
       ORDER BY total_vendido DESC
       LIMIT ?`,
      [...params, limit]
    );

    return result.recordset;
  }

  // Reporte de caja
  async getCashReport(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.fechaDesde) {
      whereClause += ' AND DATE(cd.fecha_apertura) >= ?';
      params.push(filters.fechaDesde);
    }

    if (filters.fechaHasta) {
      whereClause += ' AND DATE(cd.fecha_apertura) <= ?';
      params.push(filters.fechaHasta);
    }

    const result = await executeQuery(
      `SELECT 
        cd.cash_drawer_id,
        u.full_name as cajero,
        DATE(cd.fecha_apertura) as fecha,
        cd.monto_inicial,
        cd.monto_efectivo,
        cd.monto_tarjeta,
        cd.monto_qr,
        (cd.monto_efectivo + cd.monto_tarjeta + cd.monto_qr) as monto_cierre,
        cd.diferencia,
        CASE 
          WHEN cd.diferencia = 0 THEN 'CUADRADO'
          WHEN cd.diferencia > 0 THEN 'FALTANTE'
          ELSE 'SOBRANTE'
        END as estado
       FROM cash_drawer cd
       INNER JOIN users u ON cd.user_id = u.user_id
       ${whereClause}
       ORDER BY cd.fecha_apertura DESC`,
      params
    );

    return result.recordset;
  }

  // Resumen ejecutivo
  async getExecutiveSummary(filters = {}) {
    const params = ['COMPLETADA'];

    let dateFilter = '';
    if (filters.fechaDesde && filters.fechaHasta) {
      dateFilter = `AND DATE(s.fecha_venta) >= ? AND DATE(s.fecha_venta) <= ?`;
      params.push(filters.fechaDesde, filters.fechaHasta);
    }

    const result = await executeQuery(
      `SELECT 
        COUNT(DISTINCT s.sale_id) as total_ventas,
        SUM(s.total) as total_ventas_moneda,
        SUM(s.subtotal) as subtotal,
        SUM(s.tax) as total_impuestos,
        AVG(s.total) as ticket_promedio,
        COUNT(DISTINCT s.user_id) as cajeros_activos,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) as total_productos,
        (SELECT COUNT(*) FROM products WHERE stock_actual <= stock_minimo) as productos_criticos,
        (SELECT SUM(stock_actual * cost_price) FROM products WHERE is_active = 1) as inventario_valor
       FROM sales s
       WHERE s.state = ? ${dateFilter}`,
      params
    );

    return result.recordset[0];
  }

  // Análisis de métodos de pago
  async getPaymentMethodsAnalysis(filters = {}) {
    const params = ['COMPLETADA'];

    let dateFilter = '';
    if (filters.fechaDesde && filters.fechaHasta) {
      dateFilter = `AND DATE(s.fecha_venta) >= ? AND DATE(s.fecha_venta) <= ?`;
      params.push(filters.fechaDesde, filters.fechaHasta);
    }

    const result = await executeQuery(
      `SELECT 
        pm.metodo_pago,
        COUNT(DISTINCT s.sale_id) as total_transacciones,
        SUM(pm.monto) as monto_total,
        AVG(pm.monto) as monto_promedio,
        MIN(pm.monto) as monto_minimo,
        MAX(pm.monto) as monto_maximo
       FROM payment_methods pm
       INNER JOIN sales s ON pm.sale_id = s.sale_id
       WHERE s.state = ? ${dateFilter}
       GROUP BY pm.metodo_pago
       ORDER BY monto_total DESC`,
      params
    );

    return result.recordset;
  }

  // Alertas de inventario
  async getInventoryAlerts() {
    const result = await executeQuery(
      `SELECT 
        p.product_id,
        p.barcode,
        p.product_name,
        c.category_name,
        p.stock_actual,
        p.stock_minimo,
        (p.stock_minimo - p.stock_actual) as faltan_unidades,
        CASE 
          WHEN p.stock_actual = 0 THEN 'AGOTADO'
          WHEN p.stock_actual < p.stock_minimo THEN 'CRÍTICO'
          ELSE 'BAJO'
        END as alerta
       FROM products p
       INNER JOIN categories c ON p.category_id = c.category_id
       WHERE p.stock_actual <= p.stock_minimo AND p.is_active = 1
       ORDER BY (p.stock_minimo - p.stock_actual) DESC`
    );

    return result.recordset;
  }
}

export default new ReportsService();
