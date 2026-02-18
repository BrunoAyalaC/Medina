# 🚀 GUÍA DE INICIO RÁPIDO

## Requisitos Previos
- Node.js 16+
- SQL Server 2019+ o Azure SQL
- npm o yarn

---

## ⚡ Instalación en 5 pasos

### 1️⃣ Clonar/Descargar el proyecto
```bash
cd C:\Users\Pc\Desktop\Medina
```

### 2️⃣ Instalar dependencias
```bash
npm install
```

### 3️⃣ Crear base de datos
Abre **SQL Server Management Studio** y ejecuta:

```sql
-- Copiar y pegar todo el contenido de database.sql
```

O desde terminal:
```bash
sqlcmd -S localhost -U sa -P TuPassword -i database.sql
```

### 4️⃣ Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env`:
```env
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=MinimarketDB
DB_USER=sa
DB_PASSWORD=TuPassword123

JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
PORT=3000
CORS_ORIGIN=http://localhost:3001

YAPE_API_KEY=tu_yape_api_key
PLIN_API_KEY=tu_plin_api_key
```

### 5️⃣ Iniciar servidor
```bash
npm run dev
```

Deberías ver:
```
╔════════════════════════════════════════════════════════╗
║  🚀 MINIMARKET SYSTEM API - INICIADO                   ║
╠════════════════════════════════════════════════════════╣
║  Servidor:   http://localhost:3000                     ║
║  Entorno:    development                               ║
║  Base datos: localhost                                 ║
╚════════════════════════════════════════════════════════╝
```

---

## ✅ Verificar que todo funciona

### Test de salud
```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-02-17T15:30:00Z",
  "environment": "development"
}
```

### Test de login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🧪 Crear usuario de prueba

```sql
-- Ejecutar en SQL Server Management Studio

-- 1. Crear usuario admin
INSERT INTO Users (Username, Email, PasswordHash, RoleID, FullName)
VALUES ('admin', 'admin@example.com', 
  '$2a$10$UEfk8xeIlbK0VGKd6jK8nOeN5Y1K3L4M5N6O7P8Q9R0S1T2U3V4W5X6', 
  1, 'Administrador');

-- 2. Crear usuario cajero
INSERT INTO Users (Username, Email, PasswordHash, RoleID, FullName)
VALUES ('cajero1', 'cajero@example.com',
  '$2a$10$UEfk8xeIlbK0VGKd6jK8nOeN5Y1K3L4M5N6O7P8Q9R0S1T2U3V4W5X6',
  2, 'Juan Pérez');

-- 3. Crear categoría y productos de prueba
INSERT INTO Categories (CategoryName) VALUES ('Bebidas');
INSERT INTO Products (Barcode, ProductName, CategoryID, CostPrice, SellingPrice, StockActual, StockMinimo)
VALUES ('7501234567890', 'Leche Fresca 1L', 1, 2.50, 3.50, 100, 10);
```

### Credenciales de prueba
- **Usuario**: `admin`
- **Contraseña**: `admin123` ← ⚠️ Cambiar en producción
- **Rol**: Administrador

---

## 📚 Comandos útiles

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start

# Tests
npm run test

# Linting
npm run lint

# Ver logs
tail -f logs/app.log
```

---

## 🔌 Probar endpoints con cURL

### Obtener token
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.tokens.accessToken')

echo $TOKEN
```

### Usar token en requests
```bash
curl http://localhost:3000/api/inventory \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🆘 Solucionar problemas

### Error: "No se puede conectar a SQL Server"
```
Verificar:
1. SQL Server está corriendo
2. Puerto 1433 abierto
3. Credenciales correctas en .env
4. Base de datos MinimarketDB creada
```

### Error: "ENOENT: no such file or directory, open '.env'"
```bash
# Solución:
cp .env.example .env
```

### Error: "ERR_HTTP_HEADERS_SENT"
```
Reiniciar servidor:
npm run dev
```

### Puerto 3000 ya en uso
```bash
# Cambiar puerto en .env:
PORT=3001
```

---

## 📖 Documentación

- **API Endpoints**: Ver `API_DOCS.md`
- **Estructura del Proyecto**: Ver `README.md`
- **Estado Actual**: Ver `PROJECT_STATUS.md`
- **Plan Original**: Ver `plan.txt`

---

## 🎯 Próximos pasos después de verificar

1. **Crear usuarios de prueba** (ver sección anterior)
2. **Abrir caja** para comenzar a vender
3. **Registrar entrada de productos** en inventario
4. **Hacer una venta de prueba**
5. **Cerrar caja y arquear**
6. **Ver reportes**

---

## 💡 Ejemplos rápidos

### Crear usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan",
    "email": "juan@example.com",
    "password": "Juan123456",
    "fullName": "Juan Pérez",
    "roleId": 2
  }'
```

### Abrir caja
```bash
curl -X POST http://localhost:3000/api/cash-drawer/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"montoInicial": 500}'
```

### Registrar entrada de producto
```bash
curl -X POST http://localhost:3000/api/inventory/entrada \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "cantidad": 50,
    "proveedor": "Distribuidor ABC",
    "observaciones": "Compra semanal"
  }'
```

---

**¡Listo!** 🎉 Tu sistema de minimarket está operacional.

Pregunta si necesitas ayuda: github.com/anomalyco/opencode
