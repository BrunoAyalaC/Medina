import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { executeQuery } from '../config/database.js';

export class AuthService {
  async registerUser(userData) {
    const { username, email, password, fullName, roleId } = userData;

    // Validar que no exista usuario
    const existingUser = await executeQuery(
      'SELECT UserID FROM Users WHERE Username = @username OR Email = @email',
      { username, email }
    );

    if (existingUser.recordset.length > 0) {
      throw new AppError('El usuario o correo ya existe', 400);
    }

    // Hashear contraseña
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insertar usuario
    const result = await executeQuery(
      `INSERT INTO Users (Username, Email, PasswordHash, RoleID, FullName, CreatedAt)
       VALUES (@username, @email, @passwordHash, @roleId, @fullName, GETDATE());
       SELECT SCOPE_IDENTITY() AS UserID;`,
      { 
        username, 
        email, 
        passwordHash: hashedPassword, 
        roleId: roleId || 2, // Default: Cajero
        fullName 
      }
    );

    const userId = result.recordset[0].UserID;

    // Obtener datos completos del usuario
    const user = await this.getUserById(userId);
    
    return user;
  }

  async loginUser(username, password) {
    // Buscar usuario
    const result = await executeQuery(
      `SELECT u.*, r.RoleName FROM Users u
       INNER JOIN Roles r ON u.RoleID = r.RoleID
       WHERE u.Username = @username AND u.IsActive = 1`,
      { username }
    );

    if (result.recordset.length === 0) {
      throw new AppError('Usuario o contraseña incorrectos', 401);
    }

    const user = result.recordset[0];

    // Validar contraseña
    const isPasswordValid = await bcryptjs.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
      throw new AppError('Usuario o contraseña incorrectos', 401);
    }

    // Actualizar último login
    await executeQuery(
      'UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @userId',
      { userId: user.UserID }
    );

    // Generar tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Preparar respuesta (sin contraseña)
    delete user.PasswordHash;

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async getUserById(userId) {
    const result = await executeQuery(
      `SELECT u.*, r.RoleName FROM Users u
       INNER JOIN Roles r ON u.RoleID = r.RoleID
       WHERE u.UserID = @userId`,
      { userId }
    );

    if (result.recordset.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const user = result.recordset[0];
    delete user.PasswordHash;
    return user;
  }

  async refreshAccessToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + '_refresh');
      
      // Obtener usuario
      const user = await this.getUserById(decoded.userId);
      
      // Generar nuevo access token
      const newAccessToken = generateToken(user);
      
      return {
        accessToken: newAccessToken,
        user
      };
    } catch (error) {
      throw new AppError('Refresh token inválido', 401);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const result = await executeQuery(
      'SELECT PasswordHash FROM Users WHERE UserID = @userId',
      { userId }
    );

    if (result.recordset.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const user = result.recordset[0];

    // Validar contraseña actual
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.PasswordHash);
    if (!isPasswordValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Actualizar contraseña
    await executeQuery(
      'UPDATE Users SET PasswordHash = @passwordHash WHERE UserID = @userId',
      { passwordHash: hashedPassword, userId }
    );

    return { message: 'Contraseña actualizada correctamente' };
  }
}

export default new AuthService();
