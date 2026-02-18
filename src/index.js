import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { getPool, closePool } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import unitRoutes from './routes/unit.routes.js';
import salesRoutes from './routes/sales.routes.js';
import cashDrawerRoutes from './routes/cashDrawer.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { loggerMiddleware } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE GLOBAL
// ============================================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(loggerMiddleware);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ============================================================================
// RUTAS API
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/cash-drawer', cashDrawerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportsRoutes);

// ============================================================================
// RUTAS NO ENCONTRADAS
// ============================================================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// ============================================================================
// MANEJO DE ERRORES GLOBAL
// ============================================================================

app.use(errorHandler);

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

// En modo test, no iniciar el servidor automáticamente
const server = process.env.NODE_ENV === 'test' ? null : app.listen(PORT, async () => {
  try {
    await getPool();
    console.log(`
╔════════════════════════════════════════════════════════╗
║  🚀 MINIMARKET SYSTEM API - INICIADO                   ║
╠════════════════════════════════════════════════════════╣
║  Servidor:   http://localhost:${PORT}                   ║
║  Entorno:    ${process.env.NODE_ENV}                           ║
║  Base datos: ${process.env.DB_SERVER}                   ║
╚════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('✗ No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
});

// ============================================================================
// MANEJO DE SEÑALES DE CIERRE
// ============================================================================

process.on('SIGINT', async () => {
  console.log('\n✓ Cerrando aplicación...');
  await closePool();
  if (server) {
    server.close(() => {
      console.log('✓ Servidor cerrado');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;
