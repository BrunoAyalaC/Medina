import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectionTimeout: 15000,
    requestTimeout: 30000,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 30000
    }
  }
};

let pool = null;

export const getPool = async () => {
  if (!pool) {
    try {
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log('✓ Conexión a SQL Server establecida');
    } catch (error) {
      console.error('✗ Error conectando a SQL Server:', error.message);
      throw error;
    }
  }
  return pool;
};

export const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('✓ Conexión a SQL Server cerrada');
  }
};

export const executeQuery = async (query, params = {}) => {
  const pool = await getPool();
  const request = pool.request();

  // Agregar parámetros si existen
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }

  try {
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    throw error;
  }
};

export default { getPool, closePool, executeQuery };
