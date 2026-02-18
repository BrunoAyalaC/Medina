import SalesService from '../services/SalesService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';

export class SalesController {
  // POST /api/sales - Crear venta
  static createSale = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      cashDrawerId, 
      items, 
      subtotal, 
      tax, 
      total, 
      paidAmount,
      change,
      paymentMethods 
    } = req.body;

    const result = await SalesService.createSale({
      cashDrawerId,
      items,
      subtotal,
      tax,
      total,
      paidAmount,
      change,
      paymentMethods,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  // GET /api/sales/:id - Obtener venta con detalles
  static getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await SalesService.getSaleById(parseInt(id));

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // GET /api/sales - Listar ventas
  static listSales = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      pageSize = 50, 
      cashDrawerId, 
      userId, 
      state, 
      fechaDesde, 
      fechaHasta 
    } = req.query;

    const filters = {
      cashDrawerId: cashDrawerId ? parseInt(cashDrawerId) : null,
      userId: userId ? parseInt(userId) : null,
      state,
      fechaDesde,
      fechaHasta
    };

    const result = await SalesService.listSales(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // DELETE /api/sales/:id - Anular venta (solo Admin)
  static cancelSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await SalesService.cancelSale(parseInt(id), req.user.userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  });
}

export default SalesController;
