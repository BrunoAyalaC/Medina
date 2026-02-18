/**
 * Mock de base de datos para tests
 * Simula respuestas sin conexión real a SQL Server
 */

// Datos simulados en memoria
const mockDatabase = {
  users: [
    {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      username: 'admin',
      email: 'admin@minimarket.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: 'Admin',
      companyId: 'comp-001',
      isActive: true,
      createdAt: new Date('2026-01-01')
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      username: 'gerente',
      email: 'gerente@minimarket.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: 'Gerente',
      companyId: 'comp-001',
      isActive: true,
      createdAt: new Date('2026-01-02')
    }
  ],
  products: [
    {
      productId: 'prod-001',
      name: 'Coca Cola 2L',
      sku: 'CC-2L-001',
      price: 25000,
      cost: 15000,
      stock: 150,
      category: 'Bebidas',
      companyId: 'comp-001',
      isActive: true
    },
    {
      productId: 'prod-002',
      name: 'Pan Blanco',
      sku: 'PB-001',
      price: 8000,
      cost: 4000,
      stock: 500,
      category: 'Panadería',
      companyId: 'comp-001',
      isActive: true
    }
  ],
  sales: [],
  cashDrawers: [],
  inventory: []
};

// Mock de executeQuery que simula consultas SQL
export const executeQuery = jest.fn(async (query, params = {}) => {
  // Simular SELECT de usuarios por username
  if (query.toLowerCase().includes('select') && query.toLowerCase().includes('usuarios') && params.username) {
    const user = mockDatabase.users.find(u => u.username === params.username);
    return { recordset: user ? [user] : [], rowsAffected: [user ? 1 : 0] };
  }

  // Simular SELECT de todos los productos
  if (query.toLowerCase().includes('select') && query.toLowerCase().includes('productos')) {
    return { recordset: mockDatabase.products, rowsAffected: [mockDatabase.products.length] };
  }

  // Simular INSERT de usuario
  if (query.toLowerCase().includes('insert') && query.toLowerCase().includes('usuarios')) {
    const newUser = {
      userId: `uid-${Date.now()}`,
      username: params.username,
      email: params.email,
      password: params.password,
      role: params.role || 'Cajero',
      companyId: params.companyId || 'comp-001',
      isActive: true,
      createdAt: new Date()
    };
    mockDatabase.users.push(newUser);
    return { recordset: [newUser], rowsAffected: [1] };
  }

  // Simular INSERT de producto
  if (query.toLowerCase().includes('insert') && query.toLowerCase().includes('productos')) {
    const newProduct = {
      productId: `prod-${Date.now()}`,
      name: params.name,
      sku: params.sku,
      price: params.price,
      cost: params.cost,
      stock: params.stock || 0,
      category: params.category,
      companyId: params.companyId || 'comp-001',
      isActive: true
    };
    mockDatabase.products.push(newProduct);
    return { recordset: [newProduct], rowsAffected: [1] };
  }

  // Simular UPDATE
  if (query.toLowerCase().includes('update')) {
    return { recordset: [], rowsAffected: [1] };
  }

  // Simular DELETE
  if (query.toLowerCase().includes('delete')) {
    return { recordset: [], rowsAffected: [1] };
  }

  // Default: recordset vacío
  return { recordset: [], rowsAffected: [0] };
});

// Mock de getPool
export const getPool = jest.fn(async () => ({
  request: jest.fn(() => ({
    input: jest.fn().mockReturnThis(),
    query: jest.fn(async (q) => ({ recordset: [], rowsAffected: [0] })
  })),
  close: jest.fn()
}));

// Mock de closePool
export const closePool = jest.fn(async () => {
  // Mock implementation
});

export default { getPool, closePool, executeQuery };
