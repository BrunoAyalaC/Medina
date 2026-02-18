# 🏪 MINIMARKET INTERMEDIO PRO - SISTEMA COMPLETO

Sistema integrado de punto de venta (POS) con control de inventario, gestión de caja y métodos de pago modernos (QR YAPE/PLIN).

## 🛠️ STACK TECNOLÓGICO

- **Backend**: Node.js + Express.js
- **Base de Datos**: SQL Server 2019+
- **Frontend**: React.js (próximamente)
- **Métodos de Pago**: YAPE QR, PLIN QR, Tarjeta, Efectivo
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: RBAC (Role-Based Access Control)

## 📁 ESTRUCTURA DEL PROYECTO

```
minimarket-api/
├── src/
│   ├── config/           # Configuración (DB, env)
│   ├── controllers/      # Controladores (lógica de request)
│   ├── services/         # Servicios (lógica de negocio)
│   ├── repositories/     # Repositories (acceso a DB)
│   ├── middleware/       # Middlewares (auth, logging, errores)
│   ├── routes/          # Rutas API
│   ├── validators/      # Validadores de entrada
│   ├── utils/           # Utilidades
│   ├── models/          # Modelos de datos
│   └── index.js         # Punto de entrada
├── scripts/              # Scripts de migración
├── database.sql          # Schema SQL Server
├── package.json
├── .env.example
└── README.md
```

## 🚀 INSTALACIÓN Y SETUP

### 1. Clonar el repositorio
```bash
cd minimarket-api
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Crear base de datos
```bash
# Ejecutar el script SQL en SQL Server Management Studio
sqlcmd -S localhost -U sa -P YourPassword -i database.sql
```

### 5. Iniciar el servidor
```bash
npm run dev   # Modo desarrollo (con nodemon)
npm start     # Modo producción
```

## 📊 ESTRUCTURA DE BASE DE DATOS

### Tablas Principales:
- **Users** - Usuarios del sistema
- **Roles** - Roles y permisos (Admin, Cajero, Gerente)
- **Products** - Catálogo de productos
- **Categories** - Categorías de productos
- **Kardex** - Historial de movimientos de inventario
- **CashDrawer** - Apertura/cierre de caja
- **Sales** - Transacciones de venta
- **SaleDetails** - Detalles de cada venta
- **PaymentMethods** - Métodos de pago utilizado
- **AuditLog** - Registro de auditoría

### Vistas Útiles:
- `vw_StockCritico` - Productos bajo stock mínimo
- `vw_ResumenCaja` - Resumen diario de caja
- `vw_ProductosMasVendidos` - Top 20 productos

## 🔐 SEGURIDAD Y PERMISOS

### Roles Definidos:
- **Administrador**: Control total, reportes financieros, gestión de usuarios
- **Cajero**: Operaciones de venta, consulta de precios
- **Gerente**: Reportes, supervisión de ventas

### Autenticación:
- JWT con expiración de 24 horas
- Refresh tokens con expiración de 7 días

## 📡 ENDPOINTS API (ROADMAP)

### Autenticación (`/api/auth`)
- `POST /login` - Iniciar sesión
- `POST /register` - Registrar usuario
- `POST /refresh-token` - Renovar token

### Productos (`/api/products`)
- `GET /` - Listar productos
- `GET /:id` - Obtener producto
- `POST /` - Crear producto
- `PATCH /:id` - Actualizar producto
- `DELETE /:id` - Eliminar producto

### Inventario (`/api/inventory`)
- `GET /` - Estado actual del inventario
- `POST /entrada` - Registrar entrada de mercadería
- `POST /salida` - Registrar salida de mercadería
- `GET /kardex` - Historial de movimientos

### Caja (`/api/cash-drawer`)
- `POST /open` - Abrir caja
- `GET /current` - Obtener caja actual abierta
- `POST /close` - Cerrar caja
- `GET /history` - Historial de cajas

### Ventas (`/api/sales`)
- `POST /` - Registrar venta
- `GET /` - Listar ventas
- `GET /:id` - Obtener detalle de venta
- `DELETE /:id` - Anular venta (solo Admin)
- `GET /methods` - Métodos de pago utilizados

### Reportes (`/api/reports`)
- `GET /ventas` - Reporte de ventas
- `GET /caja` - Reporte de caja diaria
- `GET /inventario` - Reporte de inventario
- `GET /productos-mas-vendidos` - Top 20 productos
- `GET /stock-critico` - Alertas de stock bajo

## 💳 MÉTODOS DE PAGO

### Implementados:
1. **Efectivo**: Cálculo automático de vuelto
2. **QR YAPE**: Integración con API de YAPE
3. **QR PLIN**: Integración con API de PLIN
4. **Tarjeta**: Referencia de transacción/voucher
5. **Pagos Mixtos**: Combinación de múltiples métodos

## ✨ CARACTERÍSTICAS PRINCIPALES

✅ **Control de Inventario Completo**
- Registro de entradas/salidas
- Auditoría de cambios
- Alertas de stock bajo
- Cálculo de COGS (Costo de Bienes Vendidos)

✅ **Punto de Venta (POS) Dinámico**
- Carrito de compras en tiempo real
- Búsqueda por código de barras
- Cálculo automático de impuestos

✅ **Gestión de Caja**
- Apertura/cierre diario
- Conciliación automática (Esperado vs Real)
- Historial de movimientos

✅ **Seguridad Multinivel**
- Validación de roles
- Auditoría completa
- Restricción de operaciones críticas

✅ **Reportes Avanzados**
- Ventas por período
- Análisis de productos
- Estados de caja

## 🧪 TESTING

```bash
npm run test                 # Ejecutar tests
npm run test -- --coverage  # Con cobertura
```

## 📝 CONVENCIONES DE CÓDIGO

- **Commits**: `feat(scope): descripción` (semántico)
- **Nombres**: camelCase para variables, PascalCase para clases
- **Errores**: Usar AppError con statusCode
- **Validación**: Express-validator en middleware

## 🐛 DEBUGGING

```bash
# Con logs detallados
DEBUG=* npm run dev
```

## 📚 DOCUMENTACIÓN ADICIONAL

- [Documentación de API (Postman Collection)](./docs/api.postman_collection.json)
- [Diagrama de Base de Datos](./docs/database-diagram.md)
- [Guía de Integración YAPE/PLIN](./docs/payment-integration.md)

## 🔄 PRÓXIMAS FASES

1. ✅ **Fase 1**: Setup base de datos y API skeleton
2. 🔄 **Fase 2**: Implementar autenticación y RBAC
3. ⏳ **Fase 3**: Módulos de inventario y caja
4. ⏳ **Fase 4**: POS dinámico y métodos de pago
5. ⏳ **Fase 5**: Frontend React
6. ⏳ **Fase 6**: Reportes y optimizaciones

## 📞 SOPORTE

Para reportar issues o sugerencias:
- 📧 Email: support@minimarket.local
- 🐙 GitHub Issues: [Crear issue](https://github.com/minimarket/issues)

## 📄 LICENCIA

ISC

---

**Última actualización**: Febrero 17, 2026
**Versión**: 1.0.0
