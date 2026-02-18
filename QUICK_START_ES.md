# 🚀 GUÍA RÁPIDA DE INICIO - MINIMARKET POS

**Estado:** ✅ LISTO PARA USAR  
**Última actualización:** 18 de Febrero de 2026

---

## ⚡ Inicio Rápido (5 minutos)

### Paso 1: Preparar el entorno

```bash
# Ir a la carpeta del proyecto
cd C:\Users\Pc\Desktop\Medina

# Instalar todas las dependencias (backend + frontend)
npm install
cd frontend && npm install && cd ..
```

### Paso 2: Configurar base de datos

```bash
# Crear base de datos MySQL y cargar datos iniciales
npm run init-db

# Verifica que la BD está creada correctamente
# Deberías ver mensajes como:
# ✓ Database 'minimarket_test' created successfully
# ✓ All tables created
```

### Paso 3: Abrir dos terminales

**Terminal 1 - Backend (Express API):**
```bash
cd C:\Users\Pc\Desktop\Medina
npm run dev

# Espera ver:
# ╔════════════════════════════════════════════════════════╗
# ║  🚀 MINIMARKET SYSTEM API - INICIADO                   ║
# ║  Servidor:   http://localhost:3000                     ║
# ╚════════════════════════════════════════════════════════╝
```

**Terminal 2 - Frontend (React):**
```bash
cd C:\Users\Pc\Desktop\Medina\frontend
npm run dev

# Espera ver:
# ➜  Local:   http://localhost:5173/
```

### Paso 4: Abrir navegador

```
Accede a:  http://localhost:5173
```

### Paso 5: Inicia sesión

```
Usuario:  admin
Clave:    admin123
```

---

## 👥 Otros usuarios disponibles

```
Usuario: gerente
Clave:   gerente123
Rol:     Gerente

Usuario: cajero
Clave:   cajero123
Rol:     Cajero
```

---

## 🔍 Verificar que todo está funcionando

### Verificar Backend

```bash
# En otra terminal, ejecuta:
curl http://localhost:3000/health

# Deberías ver una respuesta JSON:
# {
#   "status": "OK",
#   "timestamp": "2026-02-18T11:30:00.000Z",
#   "environment": "development"
# }
```

### Verificar tests

```bash
# Ejecutar todos los tests del backend
npm run test:smoke

# Deberías ver:
# PASS - 16/16 tests ✅
```

---

## 📍 URLs Importantes

| Componente | URL | Descripción |
|-----------|-----|------------|
| **Frontend** | http://localhost:5173 | Aplicación React |
| **Backend API** | http://localhost:3000/api | Servidor Express |
| **Health Check** | http://localhost:3000/health | Estado del servidor |
| **Base de datos** | localhost:3306 | MySQL Server |

---

## 🛠️ Solución de problemas comunes

### Error: "Cannot connect to MySQL"

```bash
# 1. Verificar que MySQL está corriendo
# En Windows, abre Services y busca "MySQL80"
# Debe estar "Running"

# 2. Si no está corriendo, inicia el servicio:
net start MySQL80

# 3. O reinicia MySQL:
net stop MySQL80
net start MySQL80
```

### Error: "Port 3000 is already in use"

```bash
# 1. Encuentra qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# 2. Termina ese proceso (reemplaza PID con el número)
taskkill /PID 12345 /F

# 3. O usa otro puerto editando .env:
# PORT=3001
```

### Error: "Frontend can't connect to API"

```bash
# 1. Verifica que el backend está corriendo
curl http://localhost:3000/health

# 2. Verifica frontend/.env.local
cat frontend/.env.local
# Debe contener: VITE_API_URL=http://localhost:3000/api

# 3. Actualiza la página en el navegador (Ctrl+Shift+R)
```

---

## 📊 Páginas disponibles después de login

1. **Dashboard** - Panel de control con métricas
2. **POS** - Caja registradora para ventas
3. **Productos** - Gestión de inventario
4. **Caja** - Operaciones de efectivo
5. **Inventario** - Control de stock
6. **Reportes** - Análisis y reportes

---

## ✅ Verificación completa

```bash
# 1. Backend corriendo?
curl http://localhost:3000/health

# 2. Frontend accesible?
# Abre http://localhost:5173 en navegador

# 3. Base de datos existe?
mysql -u root -p -h localhost -e "USE minimarket_test; SHOW TABLES;"

# 4. Tests pasando?
npm run test:smoke
```

---

## 📖 Documentación Completa

Para instrucciones más detalladas, consulta:

- **DEPLOYMENT_AND_STARTUP_GUIDE.md** - Guía completa (600+ líneas)
- **FINAL_PROJECT_STATUS.md** - Estado del proyecto
- **API_DOCS.md** - Documentación de API
- **ACCESSIBILITY_AUDIT_REPORT.md** - Accesibilidad

---

## 🔄 Comandos útiles

```bash
# Backend
npm run dev              # Iniciar en modo desarrollo
npm run test:smoke      # Ejecutar tests smoke
npm run test:all        # Ejecutar todos los tests
npm run init-db         # Inicializar base de datos

# Frontend
cd frontend
npm run dev             # Iniciar en modo desarrollo
npm run build           # Compilar para producción
npm run test            # Ejecutar tests

# Base de datos
npm run migrate         # Ejecutar migraciones
```

---

## ⚙️ Variables de entorno

### Backend (.env)

```
DB_SERVER=localhost
DB_PORT=3306
DB_NAME=minimarket_test
DB_USER=root
DB_PASSWORD=root
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:5173
```

### Frontend (frontend/.env.local)

```
VITE_API_URL=http://localhost:3000/api
```

---

## 🎯 Siguientes pasos

### Para desarrollo:

1. Familiarizarte con la interfaz
2. Crear productos de prueba
3. Procesar una venta
4. Ver reportes generados

### Para producción:

1. Leer DEPLOYMENT_AND_STARTUP_GUIDE.md (sección "Production")
2. Configurar base de datos de producción
3. Actualizar variables de entorno
4. Implementar certificados SSL
5. Configurar servidor de producción

---

## 📞 Necesitas ayuda?

1. Consulta la guía completa: `DEPLOYMENT_AND_STARTUP_GUIDE.md`
2. Revisa la documentación de API: `API_DOCS.md`
3. Verifica los logs en: `logs/app.log`

---

**¡Sistema listo para usar! ✅**

Cualquier duda, consulta la documentación completa en el proyecto.
