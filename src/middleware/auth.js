import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new AppError('Token no proporcionado', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Token inválido o expirado', 401));
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    if (!roles.includes(req.user.roleName)) {
      return next(new AppError('Permisos insuficientes', 403));
    }

    next();
  };
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.UserID,
      username: user.Username,
      roleName: user.RoleName,
      email: user.Email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.UserID,
      username: user.Username
    },
    process.env.JWT_SECRET + '_refresh',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d' }
  );
};
