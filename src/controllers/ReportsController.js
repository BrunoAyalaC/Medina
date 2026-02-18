import ReportsService from '../services/ReportsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class ReportsController {
  // GET /api/reports/ventas - Reporte de ventas
  static getSalesReport = asyncHandler(async (req, res) => {
    const { fechaDesde, fechaHasta, userId } = req.query;

    const result = await ReportsService.getSalesReport({
      fechaDesde,
      fechaHasta,
      userId: userId ? parseInt(userId) : null
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });

  // GET /api/reports/productos-top - Productos más vendidos
  static getTopProducts = asyncHandler(async (req, res) => {
    const { fechaDesde, fechaHasta, limit = 20 } = req.query;

    const result = await ReportsService.getTopProducts({
      fechaDesde,
      fechaHasta,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });

  // GET /api/reports/caja - Reporte de caja
  static getCashReport = asyncHandler(async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    const result = await ReportsService.getCashReport({
      fechaDesde,
      fechaHasta
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });

  // GET /api/reports/resumen - Resumen ejecutivo
  static getExecutiveSummary = asyncHandler(async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    const result = await ReportsService.getExecutiveSummary({
      fechaDesde,
      fechaHasta
    });

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // GET /api/reports/metodos-pago - Análisis de métodos de pago
  static getPaymentMethodsAnalysis = asyncHandler(async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    const result = await ReportsService.getPaymentMethodsAnalysis({
      fechaDesde,
      fechaHasta
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });

  // GET /api/reports/alertas-inventario - Alertas de inventario
  static getInventoryAlerts = asyncHandler(async (req, res) => {
    const result = await ReportsService.getInventoryAlerts();

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });
}

export default ReportsController;
