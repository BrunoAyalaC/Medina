/**
 * Setup para tests - Cargar variables de entorno y mocks
 */
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env.test
dotenv.config({ path: path.join(__dirname, '.env.test') });

// Mockear el middleware de autenticación para permitir todos los requests en test
jest.mock('./src/middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    // En tests, permitir todos los requests con datos simulados
    if (req.headers.authorization) {
      req.user = {
        userId: 'test-user-1',
        username: 'testadmin',
        role: 'Admin',
        companyId: 'comp-001'
      };
    }
    next();
  },
  requireRole: (...roles) => (req, res, next) => {
    // En tests, permitir todos los roles
    next();
  },
  default: {}
}));

// Mockear la base de datos
jest.mock('./src/config/database.js', () => {
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcrypt');

  // Datos en memoria para tests
  const testData = {
    users: [
      {
        userId: 'test-user-1',
        username: 'testadmin',
        email: 'admin@test.com',
        password: bcrypt.hashSync('TestPassword123!', 10),
        role: 'Admin',
        companyId: 'comp-001',
        isActive: true,
        createdAt: new Date()
      }
    ],
    products: [
      {
        productId: 'prod-1',
        name: 'Coca Cola 2L',
        sku: 'CC2L001',
        price: 25000,
        cost: 15000,
        stock: 100,
        category: 'Bebidas',
        companyId: 'comp-001',
        isActive: true
      }
    ],
    createdUsers: {}
  };

  return {
    executeQuery: jest.fn(async (query, params = {}) => {
      const queryLower = query.toLowerCase();

      // ===== USUARIOS =====
      
      // SELECT usuario por username (login)
      if (queryLower.includes('select') && queryLower.includes('usuarios') && 
          (params.username || query.includes('@username'))) {
        const username = params.username || 'testadmin';
        const user = testData.users.find(u => u.username === username) ||
                     Object.values(testData.createdUsers).find(u => u.username === username);
        
        if (user) {
          return { recordset: [{ ...user, password: user.password }], rowsAffected: [1] };
        }
        return { recordset: [], rowsAffected: [0] };
      }

      // INSERT usuario (register)
      if (queryLower.includes('insert') && queryLower.includes('usuarios')) {
        const newUser = {
          userId: `uid-${Date.now()}`,
          username: params.username || 'testuser',
          email: params.email || `test${Date.now()}@test.com`,
          password: bcrypt.hashSync(params.password || 'TestPassword123!', 10),
          role: params.role || 'Cajero',
          companyId: params.companyId || 'comp-001',
          isActive: true,
          createdAt: new Date()
        };
        testData.createdUsers[newUser.userId] = newUser;
        return { recordset: [newUser], rowsAffected: [1] };
      }

      // ===== PRODUCTOS =====

      // SELECT productos (lista)
      if (queryLower.includes('select') && queryLower.includes('productos') &&
          !queryLower.includes('where')) {
        return { recordset: testData.products, rowsAffected: [testData.products.length] };
      }

      // SELECT producto por ID
      if (queryLower.includes('select') && queryLower.includes('productos') &&
          (queryLower.includes('productid') || params.productId)) {
        const productId = params.productId || 'prod-1';
        const product = testData.products.find(p => p.productId === productId);
        return { recordset: product ? [product] : [], rowsAffected: [product ? 1 : 0] };
      }

      // INSERT producto
      if (queryLower.includes('insert') && queryLower.includes('productos')) {
        const newProduct = {
          productId: `prod-${Date.now()}`,
          name: params.name || 'Producto Test',
          sku: params.sku || `SKU${Date.now()}`,
          price: params.price || 10000,
          cost: params.cost || 5000,
          stock: params.stock || 0,
          category: params.category || 'General',
          companyId: params.companyId || 'comp-001',
          isActive: true
        };
        testData.products.push(newProduct);
        return { recordset: [newProduct], rowsAffected: [1] };
      }

      // UPDATE producto (stock, precio, etc)
      if (queryLower.includes('update') && queryLower.includes('productos')) {
        return { recordset: [], rowsAffected: [1] };
      }

      // DELETE producto
      if (queryLower.includes('delete') && queryLower.includes('productos')) {
        return { recordset: [], rowsAffected: [1] };
      }

      // Default para otras queries
      return { recordset: [], rowsAffected: [0] };
    }),

    getPool: jest.fn(async () => ({
      request: jest.fn(() => ({
        input: jest.fn().mockReturnThis(),
        query: jest.fn(async () => ({ recordset: [], rowsAffected: [0] }))
      })),
      close: jest.fn()
    })),

    closePool: jest.fn(async () => {}),

    default: {
      executeQuery: jest.fn(),
      getPool: jest.fn(),
      closePool: jest.fn()
    }
  };
});

// Mockear AuthService con JWT válidos
jest.mock('./src/services/AuthService.js', () => {
  const jwt = require('jsonwebtoken');
  
  return {
    registerUser: jest.fn(async (userData) => ({
      userId: `uid-${Date.now()}`,
      username: userData.username,
      email: userData.email,
      role: userData.roleId ? 'Gerente' : 'Cajero',
      companyId: 'comp-001',
      createdAt: new Date()
    })),

    loginUser: jest.fn(async (username, password) => {
      const user = {
        userId: 'test-user-1',
        username: username,
        email: 'test@test.com',
        role: 'Admin',
        companyId: 'comp-001'
      };
      
      return {
        user,
        tokens: {
          accessToken: jwt.sign(
            { userId: user.userId, username: user.username, role: user.role, companyId: 'comp-001' },
            process.env.JWT_SECRET || 'test-secret-key',
            { expiresIn: '24h' }
          ),
          refreshToken: jwt.sign(
            { userId: user.userId, username: user.username },
            process.env.JWT_SECRET || 'test-secret-key',
            { expiresIn: '7d' }
          )
        }
      };
    }),

    verifyPassword: jest.fn(async () => true),

    refreshAccessToken: jest.fn(async (refreshToken) => ({
      accessToken: require('jsonwebtoken').sign(
        { userId: 'test-user-1', username: 'testadmin', role: 'Admin', companyId: 'comp-001' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      ),
      user: { userId: 'test-user-1', username: 'testadmin' }
    })),

    changePassword: jest.fn(async () => ({ message: 'Contraseña actualizada' })),

    default: {}
  };
});

// Configurar timeouts
jest.setTimeout(30000);

