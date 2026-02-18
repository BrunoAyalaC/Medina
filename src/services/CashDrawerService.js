import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class CashDrawerService {
  // Abrir caja
  async openCashDrawer(userId, montoInicial) {
    // Verificar si hay caja abierta del mismo usuario en el día
    const existingCash = await executeQuery(
      `SELECT CashDrawerID FROM CashDrawer 
       WHERE UserID = @userId AND State = 'ABIERTA' 
       AND CAST(FechaApertura AS DATE) = CAST(GETDATE() AS DATE)`,
      { userId }
    );

    if (existingCash.recordset.length > 0) {
      throw new AppError('Ya existe una caja abierta para este usuario hoy', 400);
    }

    // Insertar nueva caja
    const result = await executeQuery(
      `INSERT INTO CashDrawer (UserID, FechaApertura, MontoInicial, State)
       VALUES (@userId, GETDATE(), @montoInicial, 'ABIERTA');
       SELECT SCOPE_IDENTITY() AS CashDrawerID;`,
      { userId, montoInicial }
    );

    return {
      cashDrawerId: result.recordset[0].CashDrawerID,
      message: 'Caja abierta exitosamente'
    };
  }

  // Obtener caja actual abierta del usuario
  async getCurrentOpenCash(userId) {
    const result = await executeQuery(
      `SELECT * FROM CashDrawer 
       WHERE UserID = @userId AND State = 'ABIERTA' 
       AND CAST(FechaApertura AS DATE) = CAST(GETDATE() AS DATE)`,
      { userId }
    );

    if (result.recordset.length === 0) {
      throw new AppError('No hay caja abierta para este usuario', 404);
    }

    return result.recordset[0];
  }

  // Agregar movimiento a caja
  async addMovement(cashDrawerId, tipoMovimiento, monto, motivo, userId) {
    // Validar que la caja existe y está abierta
    const cash = await executeQuery(
      'SELECT * FROM CashDrawer WHERE CashDrawerID = @cashDrawerId AND State = @state',
      { cashDrawerId, state: 'ABIERTA' }
    );

    if (cash.recordset.length === 0) {
      throw new AppError('Caja no encontrada o no está abierta', 404);
    }

    if (tipoMovimiento === 'EGRESO') {
      const totalActual = (cash.recordset[0].MontoEfectivo || 0) + 
                         (cash.recordset[0].MontoTarjeta || 0) + 
                         (cash.recordset[0].MontoQR || 0);
      
      if (totalActual < monto) {
        throw new AppError(`Fondos insuficientes. Disponible: ${totalActual}`, 400);
      }
    }

    // Insertar movimiento
    const result = await executeQuery(
      `INSERT INTO CashMovements (CashDrawerID, TipoMovimiento, Monto, Motivo, UserID)
       VALUES (@cashDrawerId, @tipoMovimiento, @monto, @motivo, @userId);
       SELECT SCOPE_IDENTITY() AS CashMovementID;`,
      { cashDrawerId, tipoMovimiento, monto, motivo, userId }
    );

    return {
      movementId: result.recordset[0].CashMovementID,
      message: 'Movimiento registrado'
    };
  }

  // Cerrar caja (Arqueo)
  async closeCashDrawer(cashDrawerId, userData) {
    const { montoEfectivo, montoTarjeta, montoQR, observaciones } = userData;

    // Obtener datos actuales de caja
    const cash = await executeQuery(
      `SELECT cd.*, u.FullName FROM CashDrawer cd
       INNER JOIN Users u ON cd.UserID = u.UserID
       WHERE cd.CashDrawerID = @cashDrawerId`,
      { cashDrawerId }
    );

    if (cash.recordset.length === 0) {
      throw new AppError('Caja no encontrada', 404);
    }

    const cajaDatos = cash.recordset[0];

    if (cajaDatos.State !== 'ABIERTA') {
      throw new AppError('La caja ya está cerrada', 400);
    }

    // Obtener total de ventas del día
    const ventas = await executeQuery(
      `SELECT 
        COALESCE(SUM(CASE WHEN pm.MetodoPago = 'EFECTIVO' THEN pm.Monto ELSE 0 END), 0) as TotalEfectivo,
        COALESCE(SUM(CASE WHEN pm.MetodoPago IN ('YAPE', 'PLIN') THEN pm.Monto ELSE 0 END), 0) as TotalQR,
        COALESCE(SUM(CASE WHEN pm.MetodoPago = 'TARJETA' THEN pm.Monto ELSE 0 END), 0) as TotalTarjeta,
        COALESCE(SUM(s.Total), 0) as TotalVentas
       FROM Sales s
       LEFT JOIN PaymentMethods pm ON s.SaleID = pm.SaleID
       WHERE s.CashDrawerID = @cashDrawerId AND s.State = 'COMPLETADA'`,
      { cashDrawerId }
    );

    const ventasDatos = ventas.recordset[0];

    // Calcular totales esperados
    const montoEsperado = cajaDatos.MontoInicial + ventasDatos.TotalVentas;
    const montoReal = montoEfectivo + montoTarjeta + montoQR;
    const diferencia = montoReal - montoEsperado;

    try {
      // Cerrar caja
      await executeQuery(
        `UPDATE CashDrawer 
         SET State = 'CERRADA',
             FechaCierre = GETDATE(),
             MontoCierre = @montoReal,
             MontoEfectivo = @montoEfectivo,
             MontoTarjeta = @montoTarjeta,
             MontoQR = @montoQR,
             Diferencia = @diferencia,
             Observaciones = @observaciones
         WHERE CashDrawerID = @cashDrawerId`,
        { 
          cashDrawerId, 
          montoEfectivo, 
          montoTarjeta, 
          montoQR,
          montoReal, 
          diferencia,
          observaciones 
        }
      );

      return {
        cashDrawerId,
        montoInicial: cajaDatos.MontoInicial,
        totalVentas: ventasDatos.TotalVentas,
        detalleVentas: {
          efectivo: ventasDatos.TotalEfectivo,
          qr: ventasDatos.TotalQR,
          tarjeta: ventasDatos.TotalTarjeta
        },
        montoEsperado,
        montoReal,
        diferencia,
        estado: diferencia === 0 ? 'CUADRADO' : (diferencia > 0 ? 'FALTANTE' : 'SOBRANTE'),
        message: 'Caja cerrada correctamente'
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener historial de cajas
  async getCashDrawerHistory(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE 1=1';
    const params = { pageSize, offset: (page - 1) * pageSize };

    if (filters.userId) {
      whereClause += ' AND cd.UserID = @userId';
      params.userId = filters.userId;
    }

    if (filters.state) {
      whereClause += ' AND cd.State = @state';
      params.state = filters.state;
    }

    if (filters.fechaDesde) {
      whereClause += ' AND CAST(cd.FechaApertura AS DATE) >= @fechaDesde';
      params.fechaDesde = filters.fechaDesde;
    }

    // Obtener total
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM CashDrawer cd ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos
    const result = await executeQuery(
      `SELECT 
        cd.CashDrawerID,
        u.FullName as Cajero,
        cd.FechaApertura,
        cd.MontoInicial,
        cd.MontoEfectivo,
        cd.MontoTarjeta,
        cd.MontoQR,
        (cd.MontoEfectivo + cd.MontoTarjeta + cd.MontoQR) as MontoCierre,
        cd.State,
        cd.FechaCierre,
        cd.Diferencia,
        cd.Observaciones
       FROM CashDrawer cd
       INNER JOIN Users u ON cd.UserID = u.UserID
       ${whereClause}
       ORDER BY cd.FechaApertura DESC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      params
    );

    return {
      data: result.recordset,
      pagination: {
        total,
        pageSize,
        pageNumber: page,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // Obtener resumen de caja actual
  async getCashSummary(cashDrawerId) {
    const result = await executeQuery(
      `SELECT 
        cd.CashDrawerID,
        u.FullName as Cajero,
        cd.FechaApertura,
        cd.MontoInicial,
        COALESCE(SUM(CASE WHEN cm.TipoMovimiento = 'INGRESO' THEN cm.Monto ELSE 0 END), 0) as TotalIngresos,
        COALESCE(SUM(CASE WHEN cm.TipoMovimiento = 'EGRESO' THEN cm.Monto ELSE 0 END), 0) as TotalEgresos,
        COALESCE(SUM(s.Total), 0) as TotalVentas,
        cd.State
       FROM CashDrawer cd
       INNER JOIN Users u ON cd.UserID = u.UserID
       LEFT JOIN CashMovements cm ON cd.CashDrawerID = cm.CashDrawerID
       LEFT JOIN Sales s ON cd.CashDrawerID = s.CashDrawerID AND s.State = 'COMPLETADA'
       WHERE cd.CashDrawerID = @cashDrawerId
       GROUP BY cd.CashDrawerID, u.FullName, cd.FechaApertura, cd.MontoInicial, cd.State`,
      { cashDrawerId }
    );

    if (result.recordset.length === 0) {
      throw new AppError('Caja no encontrada', 404);
    }

    return result.recordset[0];
  }
}

export default new CashDrawerService();
