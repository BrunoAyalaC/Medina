import { body } from 'express-validator';

export const createSaleValidator = [
  body('cashDrawerId')
    .notEmpty()
    .withMessage('CashDrawerID requerido')
    .isInt({ min: 1 })
    .withMessage('CashDrawerID debe ser un número válido'),
  
  body('items')
    .notEmpty()
    .withMessage('Items requeridos')
    .isArray({ min: 1 })
    .withMessage('Items debe ser un array con al menos 1 elemento'),
  
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('ProductID debe ser un número válido'),
  
  body('items.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número positivo'),
  
  body('items.*.precioUnitario')
    .isDecimal()
    .withMessage('Precio unitario debe ser un número válido')
    .custom(value => parseFloat(value) > 0)
    .withMessage('Precio unitario debe ser mayor a 0'),
  
  body('subtotal')
    .notEmpty()
    .withMessage('Subtotal requerido')
    .isDecimal()
    .withMessage('Subtotal debe ser un número válido'),
  
  body('tax')
    .notEmpty()
    .withMessage('Tax requerido')
    .isDecimal()
    .withMessage('Tax debe ser un número válido')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('Tax no puede ser negativo'),
  
  body('total')
    .notEmpty()
    .withMessage('Total requerido')
    .isDecimal()
    .withMessage('Total debe ser un número válido')
    .custom(value => parseFloat(value) > 0)
    .withMessage('Total debe ser mayor a 0'),
  
  body('paidAmount')
    .notEmpty()
    .withMessage('Monto pagado requerido')
    .isDecimal()
    .withMessage('Monto pagado debe ser un número válido')
    .custom(value => parseFloat(value) > 0)
    .withMessage('Monto pagado debe ser mayor a 0'),
  
  body('change')
    .notEmpty()
    .withMessage('Vuelto requerido')
    .isDecimal()
    .withMessage('Vuelto debe ser un número válido')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('Vuelto no puede ser negativo'),
  
  body('paymentMethods')
    .notEmpty()
    .withMessage('Métodos de pago requeridos')
    .isArray({ min: 1 })
    .withMessage('Métodos de pago debe ser un array con al menos 1 elemento'),
  
  body('paymentMethods.*.metodo')
    .isIn(['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN'])
    .withMessage('Método de pago inválido'),
  
  body('paymentMethods.*.monto')
    .isDecimal()
    .withMessage('Monto debe ser un número válido')
    .custom(value => parseFloat(value) > 0)
    .withMessage('Monto debe ser mayor a 0'),
  
  body('paymentMethods.*.referencia')
    .optional()
    .trim()
];
