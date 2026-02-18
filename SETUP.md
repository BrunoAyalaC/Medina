# 🏪 Minimarket Intermedio PRO - Sistema Completo

**Sistema de Punto de Venta + Gestión de Inventario con Backend Node.js y Frontend React**

## 🎯 Descripción

Sistema integral para gestionar una tienda/minimarket con:
- Punto de Venta (POS) con múltiples métodos de pago
- Gestión de inventario en tiempo real
- Control de caja diaria
- Reportes analíticos avanzados
- Control de acceso por roles

## 📦 Requisitos Previos

- **Node.js** 16+ (backend)
- **SQL Server** 2017+ (base de datos)
- **npm** o **yarn** (gestor de paquetes)
- **Git** (control de versiones)

## 🚀 Guía de Instalación Rápida

### 1. Backend (Node.js + Express)

```bash
# Ir al directorio del proyecto
cd C:\Users\Pc\Desktop\Medina

# Instalar dependencias del backend
npm install

# Crear archivo .env con configuración
# Ver .env.example para referencia
# Necesita:
# - PORT=3000
# - DB_HOST=localhost
# - DB_USER=sa
# - DB_PASSWORD=YourPassword
# - DB_DATABASE=minimarket_db
# - JWT_SECRET=your-secret-key
# - JWT_EXPIRES_IN=24h

# Crear la base de datos
# Ejecutar database.sql en SQL Server Management Studio

# Iniciar servidor backend
npm start
# El servidor estará en http://localhost:3000

# ✅ Verificar: http://localhost:3000/api/auth/me (sin token debe retornar 401)
```

### 2. Frontend (React + Vite)

```bash
# Ir al directorio del frontend
cd C:\Users\Pc\Desktop\Medina\frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# El frontend estará en http://localhost:5173

# Para producción
npm run build
npm run preview
```

## 🔑 Credenciales de Prueba

Después de crear la base de datos, la aplicación tiene usuarios de prueba:

```json
{
  "admin": {
    "email": "admin@minimarket.com",
    "password": "Admin@123",
    "role": "Administrador"
  },
  "gerente": {
    "email": "gerente@minimarket.com",
    "password": "Gerente@123",
    "role": "Gerente"
  },
  "cajero": {
    "email": "cajero@minimarket.com",
    "password": "Cajero@123",
    "role": "Cajero"
  }
}
```

## 📱 Páginas Principales

### Cajero
- **POS**: Vender productos con carrito dinámico
- **Caja**: Abrir/cerrar caja diaria
- **Dashboard**: Resumen de ventas del día

### Gerente (Cajero +)
- **Inventario**: Ver stock actual
- **Reportes**: Gráficos de ventas y análisis

### Administrador (Todo)
- **Gestión de Productos**: CRUD completo
- **Usuarios**: Crear/editar/eliminar usuarios
- **Configuración**: Ajustes del sistema

## 🛠️ Estructura del Proyecto

```
C:\Users\Pc\Desktop\Medina\
├── src/                           # Backend Node.js
│   ├── index.js                   # Servidor principal
│   ├── config/                    # Configuración BD
│   ├── controllers/               # Controladores (5)
│   ├── services/                  # Lógica de negocio (5)
│   ├── routes/                    # Rutas API (5 módulos)
│   ├── validators/                # Validación de input
│   └── middleware/                # Auth, error, logging
│
├── frontend/                       # React + Vite
│   ├── src/
│   │   ├── pages/                 # Páginas (7)
│   │   ├── components/            # Componentes reutilizables
│   │   ├── stores/                # State management (Zustand)
│   │   ├── services/              # Cliente HTTP (Axios)
│   │   ├── hooks/                 # Custom hooks
│   │   └── styles/                # Estilos globales
│   └── package.json               # Dependencias frontend
│
├── package.json                   # Dependencias backend
├── database.sql                   # Schema de BD
├── .env.example                   # Variables de entorno
└── README.md                      # Este archivo
```

## 📊 Endpoints API (27 Total)

### Autenticación (5)
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Crear cuenta
- `POST /api/auth/refresh-token` - Renovar JWT
- `POST /api/auth/change-password` - Cambiar contraseña
- `GET /api/auth/me` - Datos del usuario actual

### Productos (4)
- `GET /api/products?page=1&limit=10` - Listar productos
- `POST /api/products` - Crear producto (Admin)
- `PUT /api/products/:id` - Editar producto (Admin)
- `DELETE /api/products/:id` - Eliminar producto (Admin)

### Inventario (6)
- `GET /api/inventory` - Stock actual
- `POST /api/inventory/entrada` - Entrada de stock
- `POST /api/inventory/salida` - Salida de stock
- `GET /api/inventory/kardex/:productId` - Historial
- `GET /api/inventory/stock-critico` - Alertas
- `GET /api/inventory/value` - Valor total inventario

### Caja (6)
- `POST /api/cash-drawer/open` - Abrir caja
- `GET /api/cash-drawer/current` - Caja actual abierta
- `GET /api/cash-drawer/:id/movements` - Movimientos
- `POST /api/cash-drawer/:id/close` - Cerrar caja
- `GET /api/cash-drawer/history` - Historial cajas
- `GET /api/cash-drawer/:id/summary` - Resumen del día

### Ventas (4)
- `POST /api/sales` - Registrar venta
- `GET /api/sales` - Historial ventas
- `GET /api/sales/:id` - Detalle venta
- `POST /api/sales/:id/cancel` - Cancelar venta

### Reportes (6)
- `GET /api/reports/sales?days=7` - Ventas por período
- `GET /api/reports/products-top?limit=10` - Top productos
- `GET /api/reports/payment-methods?days=7` - Métodos de pago
- `GET /api/reports/daily-summary` - Resumen diario
- `GET /api/reports/alerts` - Alertas de stock
- `GET /api/reports/cash-summary` - Resumen de caja

## 🎨 Stack Tecnológico

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **mssql** (tedious) - Driver SQL Server
- **JWT** - Tokens de autenticación
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool
- **React Router v6** - Navegación
- **Zustand** - State management
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **Tailwind CSS** - Estilos
- **Lucide Icons** - Iconografía

### Base de Datos
- **SQL Server** 2017+
- **12 tablas** normalizadas
- **3 vistas** para reportes
- **Indexes** en foreign keys
- **Triggers** para auditoría (Kardex)

## 🔐 Seguridad

- ✅ Autenticación JWT con refresh tokens
- ✅ Hash de contraseñas con bcryptjs
- ✅ Validación de entrada (Express Validator)
- ✅ Control de acceso por roles (RBAC)
- ✅ Variables de entorno para secretos
- ✅ CORS configurado
- ✅ Rate limiting en development

## 📈 Características Principales

### POS (Punto de Venta)
- Búsqueda rápida de productos
- Carrito dinámico con cantidad/precio
- 4 métodos de pago (Efectivo, Tarjeta, YAPE, PLIN)
- QR para pagos YAPE/PLIN
- Cálculo automático de cambio
- Validación de monto pagado

### Gestión de Caja
- Apertura de caja con monto inicial
- Registro de movimientos en tiempo real
- Cierre de caja con reconciliación
- Historial con diferencias
- Alertas de discrepancias

### Reportes
- Gráficos de ventas (Área, Línea)
- Top 10 productos (Bar chart)
- Distribución de métodos pago (Pie chart)
- KPIs: Total, Promedio, Cantidad
- Filtros por período (Semana/Mes/Año)
- Exportación de datos (futuro)

### Inventario
- Stock en tiempo real
- Entrada/Salida de productos
- Kardex con historial completo
- Alertas de stock crítico
- Cálculo automático de valor total

## 🧪 Testing

```bash
# Backend
npm test

# Frontend
cd frontend && npm test

# E2E
npm run test:e2e
```

## 📝 Logs

Los logs se almacenan en:
```
./logs/
├── error.log      # Errores del sistema
├── combined.log   # Todos los logs
└── app.log        # Logs de aplicación
```

## 🌐 Deployable

El sistema está listo para desplegar en:
- **Heroku** - Backend
- **Vercel** - Frontend
- **AWS** - Escalabilidad
- **Azure** - Enterprise
- **DigitalOcean** - VPS

## 🐛 Solución de Problemas

### Errores Comunes

**Error: "Cannot connect to database"**
```bash
# Verificar que SQL Server está corriendo
# Revisar credenciales en .env
# Ejecutar database.sql
```

**Error: "Port 3000 already in use"**
```bash
# Cambiar PORT en .env a 3001, 3002, etc.
# O matar el proceso: netstat -ano | findstr :3000
```

**Error: "Module not found"**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentación Adicional

- `API_DOCS.md` - Referencia completa de APIs
- `PROJECT_STATUS.md` - Estado del proyecto
- `QUICKSTART.md` - Guía rápida
- `MANIFEST.md` - Inventario de archivos
- `FRONTEND_COMPLETE.md` - Documentación frontend

## 📞 Soporte

Para reportar bugs o sugerencias:
1. Revisar la documentación
2. Verificar logs en `./logs/`
3. Ejecutar tests: `npm test`
4. Crear un issue en el repositorio

## 📄 Licencia

Privado - Uso Interno

## ✨ Próximas Versiones

- **v1.1** - Offline mode con sincronización
- **v1.2** - App móvil (React Native)
- **v2.0** - Multi-tienda, Multi-moneda
- **v3.0** - IA para predicción de demanda

---

**Última actualización:** 17 de Febrero 2026  
**Desarrollado con ❤️ - Minimarket Intermedio PRO**
