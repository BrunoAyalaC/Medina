import { body } from 'express-validator';

export const openCashDrawerValidator = [
  body('montoInicial')
    .notEmpty()
    .withMessage('Monto inicial requerido')
    .isDecimal()
    .withMessage('Monto inicial debe ser un número válido')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('Monto inicial no puede ser negativo')
];

export const addMovementValidator = [
  body('cashDrawerId')
    .notEmpty()
    .withMessage('CashDrawerID requerido')
    .isInt({ min: 1 })
    .withMessage('CashDrawerID debe ser un número válido'),
  
  body('tipoMovimiento')
    .notEmpty()
    .withMessage('Tipo de movimiento requerido')
    .isIn(['INGRESO', 'EGRESO'])
    .withMessage('Tipo de movimiento debe ser INGRESO o EGRESO'),
  
  body('monto')
    .notEmpty()
    .withMessage('Monto requerido')
    .isDecimal()
    .withMessage('Monto debe ser un número válido')
    .custom(value => parseFloat(value) > 0)
    .withMessage('Monto debe ser mayor a 0'),
  
  body('motivo')
    .notEmpty()
    .withMessage('Motivo requerido')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Motivo debe tener al menos 5 caracteres')
];

export const closeCashDrawerValidator = [
  body('cashDrawerId')
    .notEmpty()
    .withMessage('CashDrawerID requerido')
    .isInt({ min: 1 })
    .withMessage('CashDrawerID debe ser un número válido'),
  
  body('montoEfectivo')
    .notEmpty()
    .withMessage('Monto en efectivo requerido')
    .isDecimal()
    .withMessage('Monto en efectivo debe ser un número válido')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('Monto en efectivo no puede ser negativo'),
  
  body('montoTarjeta')
    .notEmpty()
    .withMessage('Monto en tarjeta requerido')
    .isDecimal()
    .withMessage('Monto en tarjeta debe ser un número válido')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('Monto en tarjeta no puede ser negativo'),
  
  body('montoQR')
    .notEmpty()
    .withMessage('Monto en QR requerido')
    .isDecimal()
    .withMessage('Monto en QR debe ser un número válido')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('Monto en QR no puede ser negativo'),
  
  body('observaciones')
    .optional()
    .trim()
];
