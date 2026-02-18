# 📡 DOCUMENTACIÓN DE API - MINIMARKET INTERMEDIO PRO

## 🔐 Autenticación

Todos los endpoints (excepto login y register) requieren un token JWT en el header:

```
Authorization: Bearer {accessToken}
```

---

## 📝 ENDPOINTS

### 1. AUTENTICACIÓN (`/api/auth`)

#### Register - Crear nuevo usuario
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "juan.perez",
  "email": "juan@example.com",
  "password": "Secure123",
  "fullName": "Juan Pérez",
  "roleId": 2  // 1: Admin, 2: Cajero, 3: Gerente (opcional, default: 2)
}

Response (201):
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "UserID": 1,
    "Username": "juan.perez",
    "Email": "juan@example.com",
    "FullName": "Juan Pérez",
    "RoleName": "Cajero"
  }
}
```

#### Login - Iniciar sesión
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "juan.perez",
  "password": "Secure123"
}

Response (200):
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "UserID": 1,
      "Username": "juan.perez",
      "RoleName": "Cajero"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

#### Refresh Token - Renovar token de acceso
```
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200):
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": { /* user data */ }
  }
}
```

#### Get Current User - Obtener usuario actual
```
GET /api/auth/me
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "UserID": 1,
    "Username": "juan.perez",
    "Email": "juan@example.com",
    "FullName": "Juan Pérez",
    "RoleName": "Cajero"
  }
}
```

---

### 2. PRODUCTOS (`/api/products`)

#### Listar productos
```
GET /api/products?page=1&pageSize=50&categoryId=1&searchTerm=leche&stockCritico=false
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "ProductID": 1,
        "Barcode": "7501234567890",
        "ProductName": "Leche Fresca 1L",
        "CategoryName": "Lácteos",
        "CostPrice": 2.50,
        "SellingPrice": 3.50,
        "StockActual": 45,
        "StockMinimo": 10,
        "StockStatus": "NORMAL"
      }
    ],
    "pagination": {
      "total": 150,
      "pageSize": 50,
      "pageNumber": 1,
      "totalPages": 3
    }
  }
}
```

---

### 3. INVENTARIO (`/api/inventory`)

#### Registrar entrada de mercadería
```
POST /api/inventory/entrada
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": 1,
  "cantidad": 100,
  "proveedor": "Distribuidor ABC",
  "observaciones": "Factura #12345"
}

Response (201):
{
  "success": true,
  "message": "Entrada registrada exitosamente",
  "data": {
    "kardexId": 15,
    "productId": 1
  }
}
```

#### Registrar salida de mercadería
```
POST /api/inventory/salida
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": 1,
  "cantidad": 5,
  "motivo": "Merma",
  "responsable": "Gerente Turno",
  "observaciones": "Producto dañado"
}

Response (201):
{
  "success": true,
  "message": "Salida registrada exitosamente",
  "data": {
    "kardexId": 16,
    "productId": 1
  }
}
```

#### Obtener historial de movimientos (Kardex)
```
GET /api/inventory/kardex?page=1&productId=1&tipoMovimiento=VENTA&fechaDesde=2025-01-01&fechaHasta=2025-12-31
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "KardexID": 15,
        "ProductName": "Leche Fresca 1L",
        "TipoMovimiento": "ENTRADA",
        "Cantidad": 100,
        "MotivoCambio": "Compra",
        "StockAnterior": 10,
        "StockActual": 110,
        "Usuario": "Juan Pérez",
        "CreatedAt": "2025-02-15T10:30:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### Obtener inventario con valor
```
GET /api/inventory/value
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "CostoTotal": 5432.50,
    "ValorVenta": 8650.00,
    "TotalProductos": 125,
    "TotalUnidades": 1250
  }
}
```

---

### 4. CAJA (`/api/cash-drawer`)

#### Abrir caja
```
POST /api/cash-drawer/open
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "montoInicial": 500.00
}

Response (201):
{
  "success": true,
  "message": "Caja abierta exitosamente",
  "data": {
    "cashDrawerId": 1,
    "message": "Caja abierta exitosamente"
  }
}
```

#### Obtener caja actual abierta
```
GET /api/cash-drawer/current
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "CashDrawerID": 1,
    "UserID": 1,
    "FechaApertura": "2025-02-17T08:00:00Z",
    "MontoInicial": 500.00,
    "State": "ABIERTA",
    "summary": {
      "TotalIngresos": 0,
      "TotalEgresos": 0,
      "TotalVentas": 1250.50
    }
  }
}
```

#### Agregar movimiento de caja
```
POST /api/cash-drawer/movement
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "cashDrawerId": 1,
  "tipoMovimiento": "INGRESO",
  "monto": 100.00,
  "motivo": "Reposición de fondo de sencillo"
}

Response (201):
{
  "success": true,
  "message": "Movimiento registrado",
  "data": {
    "movementId": 5
  }
}
```

#### Cerrar caja (Arqueo)
```
POST /api/cash-drawer/close
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "cashDrawerId": 1,
  "montoEfectivo": 1650.50,
  "montoTarjeta": 0,
  "montoQR": 100.00,
  "observaciones": "Día normal, todo cuadra"
}

Response (200):
{
  "success": true,
  "message": "Caja cerrada correctamente",
  "data": {
    "cashDrawerId": 1,
    "montoInicial": 500.00,
    "totalVentas": 1250.50,
    "detalleVentas": {
      "efectivo": 1050.50,
      "qr": 100.00,
      "tarjeta": 100.00
    },
    "montoEsperado": 1750.50,
    "montoReal": 1750.50,
    "diferencia": 0,
    "estado": "CUADRADO"
  }
}
```

---

### 5. VENTAS (`/api/sales`)

#### Crear venta (POS)
```
POST /api/sales
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "cashDrawerId": 1,
  "items": [
    {
      "productId": 1,
      "cantidad": 2,
      "precioUnitario": 3.50
    },
    {
      "productId": 2,
      "cantidad": 1,
      "precioUnitario": 5.00
    }
  ],
  "subtotal": 12.00,
  "tax": 2.16,
  "total": 14.16,
  "paidAmount": 20.00,
  "change": 5.84,
  "paymentMethods": [
    {
      "metodo": "EFECTIVO",
      "monto": 20.00,
      "referencia": null
    }
  ]
}

Response (201):
{
  "success": true,
  "message": "Venta registrada exitosamente",
  "data": {
    "saleId": 42,
    "message": "Venta registrada exitosamente"
  }
}
```

#### Obtener venta con detalles
```
GET /api/sales/42
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "SaleID": 42,
    "FechaVenta": "2025-02-17T12:30:00Z",
    "Cajero": "Juan Pérez",
    "Subtotal": 12.00,
    "Tax": 2.16,
    "Total": 14.16,
    "State": "COMPLETADA",
    "detalles": [
      {
        "SaleDetailID": 1,
        "ProductName": "Leche Fresca 1L",
        "Cantidad": 2,
        "PrecioUnitario": 3.50,
        "Subtotal": 7.00
      }
    ],
    "metodosPago": [
      {
        "PaymentMethodID": 1,
        "MetodoPago": "EFECTIVO",
        "Monto": 14.16
      }
    ]
  }
}
```

#### Anular venta (solo Admin)
```
DELETE /api/sales/42
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Venta anulada exitosamente",
  "data": {
    "saleId": 42
  }
}
```

---

### 6. REPORTES (`/api/reports`)

#### Reporte de ventas por período
```
GET /api/reports/ventas?fechaDesde=2025-02-01&fechaHasta=2025-02-17
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "count": 17,
  "data": [
    {
      "Fecha": "2025-02-17",
      "TotalVentas": 42,
      "Subtotal": 500.00,
      "Impuestos": 90.00,
      "Total": 590.00,
      "TotalEfectivo": 400.00,
      "TotalQR": 150.00,
      "TotalTarjeta": 40.00
    }
  ]
}
```

#### Productos más vendidos
```
GET /api/reports/productos-top?limit=20&fechaDesde=2025-02-01&fechaHasta=2025-02-17
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "count": 20,
  "data": [
    {
      "ProductName": "Leche Fresca 1L",
      "TotalVendido": 245,
      "MontoTotal": 857.50,
      "VecesVendido": 125,
      "PrecioPromedio": 3.50
    }
  ]
}
```

#### Resumen ejecutivo
```
GET /api/reports/resumen?fechaDesde=2025-02-01&fechaHasta=2025-02-17
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "TotalVentas": 425,
    "TotalVentasMoneda": 12450.50,
    "Subtotal": 10500.00,
    "TotalImpuestos": 1950.50,
    "TicketPromedio": 29.30,
    "CajerosActivos": 5,
    "TotalProductos": 125,
    "ProductosCriticos": 8,
    "InventarioValor": 15625.75
  }
}
```

#### Alertas de inventario
```
GET /api/reports/alertas-inventario
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "count": 3,
  "data": [
    {
      "ProductName": "Aceite Vegetal",
      "StockActual": 0,
      "StockMinimo": 10,
      "FaltanUnidades": 10,
      "Alerta": "AGOTADO"
    }
  ]
}
```

---

## 🔒 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Permisos insuficientes |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 📊 Estructura de Respuesta

### Exitosa
```json
{
  "success": true,
  "message": "Descripción del éxito",
  "data": { /* contenido específico */ }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "statusCode": 400,
    "timestamp": "2025-02-17T12:30:00Z"
  }
}
```

---

## 🧪 Ejemplos con cURL

### Crear venta
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "cashDrawerId": 1,
    "items": [{"productId": 1, "cantidad": 2, "precioUnitario": 3.50}],
    "subtotal": 7.00,
    "tax": 1.26,
    "total": 8.26,
    "paidAmount": 10.00,
    "change": 1.74,
    "paymentMethods": [{"metodo": "EFECTIVO", "monto": 10.00}]
  }'
```

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 17, 2025
