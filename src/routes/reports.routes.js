import express from 'express';
import ReportsController from '../controllers/ReportsController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// Reportes básicos (cualquier usuario autenticado)
router.get('/ventas', ReportsController.getSalesReport);
router.get('/productos-top', ReportsController.getTopProducts);
router.get('/caja', ReportsController.getCashReport);
router.get('/metodos-pago', ReportsController.getPaymentMethodsAnalysis);
router.get('/alertas-inventario', ReportsController.getInventoryAlerts);

// Reporte ejecutivo (solo Admin y Gerente)
router.get('/resumen', requireRole('Administrador', 'Gerente'), ReportsController.getExecutiveSummary);

export default router;
