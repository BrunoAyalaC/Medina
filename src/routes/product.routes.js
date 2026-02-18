import express from 'express';
import ProductController from '../controllers/ProductController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { productValidator, productPriceValidator, productStockValidator } from '../validators/productValidator.js';

const router = express.Router();

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// GET - Obtener listado de productos con paginación y filtros (cualquier usuario autenticado)
router.get('/', ProductController.getProducts);

// GET - Obtener productos con stock bajo
router.get('/low-stock', ProductController.getLowStockProducts);

// GET - Obtener un producto por ID
router.get('/:id', ProductController.getProductById);

// POST - Crear nuevo producto (Admin, Gerente)
router.post('/', requireRole('Administrador', 'Gerente'), productValidator, ProductController.createProduct);

// PUT - Actualizar producto completo (Admin, Gerente)
router.put('/:id', requireRole('Administrador', 'Gerente'), productValidator, ProductController.updateProduct);

// PATCH - Actualizar solo los precios (Admin, Gerente)
router.patch('/:id/prices', requireRole('Administrador', 'Gerente'), productPriceValidator, ProductController.updateProductPrices);

// PATCH - Actualizar stock (Admin, Gerente)
router.patch('/:id/stock', requireRole('Administrador', 'Gerente'), productStockValidator, ProductController.updateProductStock);

// DELETE - Eliminar producto (soft delete) (Admin)
router.delete('/:id', requireRole('Administrador'), ProductController.deleteProduct);

export default router;
