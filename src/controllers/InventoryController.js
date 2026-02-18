import InventoryService from '../services/InventoryService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';

export class InventoryController {
  // GET /api/inventory - Obtener inventario actual
  static getInventory = asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 50, categoryId, searchTerm, stockCritico } = req.query;

    const filters = {
      categoryId: categoryId ? parseInt(categoryId) : null,
      searchTerm,
      stockCritico: stockCritico === 'true'
    };

    const result = await InventoryService.getCurrentInventory(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // POST /api/inventory/entrada - Registrar entrada de mercadería
  static registerEntrada = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { productId, cantidad, proveedor, observaciones } = req.body;

    const result = await InventoryService.registerEntrada({
      productId,
      cantidad,
      proveedor,
      userId: req.user.userId,
      observaciones
    });

    res.status(201).json({
      success: true,
      message: result.mensaje,
      data: result
    });
  });

  // POST /api/inventory/salida - Registrar salida de mercadería
  static registerSalida = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { productId, cantidad, motivo, responsable, observaciones } = req.body;

    const result = await InventoryService.registerSalida({
      productId,
      cantidad,
      motivo,
      responsable,
      userId: req.user.userId,
      observaciones
    });

    res.status(201).json({
      success: true,
      message: result.mensaje,
      data: result
    });
  });

  // GET /api/inventory/kardex - Obtener historial de movimientos
  static getKardexHistory = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      pageSize = 50, 
      productId, 
      tipoMovimiento, 
      fechaDesde, 
      fechaHasta 
    } = req.query;

    const filters = {
      productId: productId ? parseInt(productId) : null,
      tipoMovimiento,
      fechaDesde,
      fechaHasta
    };

    const result = await InventoryService.getKardexHistory(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // GET /api/inventory/stock-critico - Obtener productos con stock bajo
  static getStockCritico = asyncHandler(async (req, res) => {
    const result = await InventoryService.getStockCritico();

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });

  // GET /api/inventory/value - Obtener valor total del inventario
  static getInventoryValue = asyncHandler(async (req, res) => {
    const result = await InventoryService.getInventoryValue();

    res.status(200).json({
      success: true,
      data: result
    });
  });
}

export default InventoryController;
