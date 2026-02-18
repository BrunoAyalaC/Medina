import sql from 'mssql';
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para mssql driver (TCP/IP)
const mssqlConfig = {
  server: process.env.DB_SERVER || 'DESKTOP-UDAM3NC',
  database: process.env.DB_NAME,
  authentication: {
    type: 'ntlm',
    options: {
      domain: ''
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectionTimeout: 30000,
    requestTimeout: 60000,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 60000
    }
  }
};

// Conexión ODBC (Named Pipes - más compatible con Windows Authentication)
const odbcConnectionString = `Driver={SQL Server};Server=DESKTOP-UDAM3NC;Database=${process.env.DB_NAME};Trusted_Connection=yes;`;

let pool = null;
let useOdbc = false;

export const getPool = async () => {
  if (!pool) {
    let mssqlError = null;
    
    try {
      // Intentar primero con mssql
      pool = new sql.ConnectionPool(mssqlConfig);
      await pool.connect();
      useOdbc = false;
      console.log('✓ Conexión a SQL Server (mssql/TCP) establecida');
      return pool;
    } catch (err) {
      mssqlError = err;
      console.error('✗ Error con mssql driver:', err.message);
    }
    
    // Fallback a ODBC
    console.log('Intentando ODBC (Named Pipes)...');
    
    try {
      const connection = await odbc.connect(odbcConnectionString);
      console.log('✓ Conexión ODBC (Named Pipes) establecida');
      
      // Crear un wrapper que sea compatible
      pool = {
        _odbcConnection: connection,
        _closed: false,
        request: function() {
          if (this._closed) {
            throw new Error('Connection is closed');
          }
          const self = this;
          return {
            _connection: self._odbcConnection,
            _inputs: {},
            input: function(name, value) {
              this._inputs[name] = value;
              return this;
            },
            query: async function(sqlQuery) {
              try {
                const result = await this._connection.query(sqlQuery);
                return { recordset: result, rowsAffected: [result?.length || 0] };
              } catch (err) {
                throw err;
              }
            }
          };
        },
        close: async function() {
          if (this._odbcConnection && !this._closed) {
            await this._odbcConnection.close();
            this._closed = true;
          }
        }
      };
      useOdbc = true;
      return pool;
    } catch (odbcErr) {
      console.error('✗ Error con ODBC:', odbcErr.message);
      pool = null;
      throw new Error(`No se pudo conectar con mssql ni ODBC: ${mssqlError.message}`);
    }
  }
  
  return pool;
};

export const closePool = async () => {
  if (pool) {
    try {
      await pool.close();
    } catch (err) {
      console.error('Error cerrando pool:', err.message);
    }
    pool = null;
    useOdbc = false;
    console.log('✓ Conexión a SQL Server cerrada');
  }
};

// Convertir query de parámetros nominales (@name) a posicionales (?)
// para compatibilidad con ODBC
const convertQueryForODBC = (query, params) => {
  let convertedQuery = query;
  const paramValues = [];
  
  // Encontrar todos los parámetros nominales en la query
  const paramPattern = /@(\w+)/g;
  let match;
  
  while ((match = paramPattern.exec(query)) !== null) {
    const paramName = match[1];
    if (params[paramName] !== undefined) {
      paramValues.push(params[paramName]);
    }
  }
  
  // Reemplazar @name con ? en orden
  convertedQuery = query.replace(/@\w+/g, '?');
  
  return { query: convertedQuery, params: paramValues };
};

export const executeQuery = async (query, params = {}) => {
  try {
    const connPool = await getPool();
    const request = connPool.request();

    if (useOdbc) {
      // Para ODBC: convertir parámetros nominales a posicionales
      const { query: convertedQuery, params: convertedParams } = convertQueryForODBC(query, params);
      const result = await connPool._odbcConnection.query(convertedQuery, convertedParams);
      return { recordset: result, rowsAffected: [result?.length || 0] };
    } else {
      // Para mssql: usar parámetros nominales
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
      const result = await request.query(query);
      return result;
    }
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    // Resetear pool para reintentar
    pool = null;
    useOdbc = false;
    throw error;
  }
};

export default { getPool, closePool, executeQuery };
