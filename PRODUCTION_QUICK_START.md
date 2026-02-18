# 🚀 QUICK START: CÓMO LLEGAR A PRODUCCIÓN EN 5 HORAS

**Objetivo**: Resolver los problemas críticos para deployar con seguridad

---

## ⏱️ FASE 1: CRÍTICO (5 HORAS)

### 1. Resolver Vulnerabilidades de Seguridad (2 horas)

```bash
# Paso 1: Ver vulnerabilidades actuales
npm audit

# Paso 2: Intentar fix automático
npm audit fix --force

# Paso 3: Si hay conflictos, instalar manualmente
npm install tar@latest
npm install @azure/identity@latest
npm install ajv@latest

# Paso 4: Verificar que se resolvieron
npm audit
# Debería mostrar: "0 vulnerabilities"
```

### 2. Ejecutar Backend Tests (1.5 horas)

```bash
# Paso 1: Abrir SQL Server Configuration Manager
# Inicio > Ejecutar > SQLServerManager10.msc (o SQLServerManager14.msc para 2008 R2)

# Paso 2: Navegar a:
# SQL Server Network Configuration > Protocols for MSSQLSERVER

# Paso 3: Click derecho en TCP/IP > Enable

# Paso 4: Click derecho en TCP/IP > Properties
# Verificar: Listen All = Yes, Port = 1433

# Paso 5: Reiniciar SQL Server
net stop MSSQLSERVER
net start MSSQLSERVER
# O desde PowerShell:
Restart-Service -Name MSSQLSERVER

# Paso 6: Esperar 30 segundos, luego ejecutar tests
npm run test:smoke
npm run test:journey
npm run test:all

# Paso 7: Guardar resultados
npm run test:all > backend-tests-result.txt 2>&1
```

### 3. Implementar Secrets Management (1 hora)

```bash
# Paso 1: Crear .env.production (NO commitear nunca)
cat > .env.production << 'EOF'
# SQL Server Configuration
DB_SERVER=your-production-server
DB_PORT=1433
DB_NAME=MinimarketDB_Prod
DB_USER=prod_user
DB_PASSWORD=GENERATE_STRONG_PASSWORD_HERE

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d

# Server Configuration
PORT=3000
NODE_ENV=production
API_BASE_URL=https://your-domain.com/api

# YAPE Integration
YAPE_API_URL=https://api.yape.pe/v1
YAPE_API_KEY=your_production_yape_key
YAPE_MERCHANT_ID=your_merchant_id

# PLIN Integration
PLIN_API_URL=https://api.plin.pe/v1
PLIN_API_KEY=your_production_plin_key
PLIN_MERCHANT_ID=your_merchant_id

# Logging
LOG_LEVEL=warn
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=https://your-domain.com
EOF

# Paso 2: Generar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Paso 3: Reemplazar en .env.production con valor generado

# Paso 4: NUNCA commitear .env.production
echo ".env.production" >> .gitignore

# Paso 5: Usar variables de entorno en startup
# Modificar src/index.js:
```

```javascript
// En src/index.js, agregar al inicio:
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_SERVER',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERROR: Missing required environment variable: ${envVar}`);
    console.error(`   Please set ${envVar} in .env.production or environment`);
    process.exit(1);
  }
}
console.log('✓ All required environment variables are set');
```

### 4. Agregar Rate Limiting (30 min)

```bash
npm install express-rate-limit
```

```javascript
// En src/index.js, después de los imports:
import rateLimit from 'express-rate-limit';

// Antes de las rutas, agregar:
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Aplicar a todas las rutas /api/
app.use('/api/', limiter);

// Limiter más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 intentos por 15 minutos
  skipSuccessfulRequests: true, // No contar los exitosos
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

```bash
# Verificar que funciona
npm run test:smoke
# Debería ver rate limiting en acción
```

---

## ✅ VALIDACIÓN FASE 1

```bash
# Checklist final
✓ npm audit → "0 vulnerabilities"
✓ npm run test:all → Todos los tests PASS
✓ .env.production creado (NO en git)
✓ Rate limiting implementado
✓ Environment variables validadas al startup

# Comando final de validación
npm run build
npm run start:prod

# Si todo pasa, está listo para FASE 2
```

---

## 🎯 PRÓXIMOS PASOS

Después de completar Fase 1:

### FASE 2: IMPORTANTE (Para producción robusta)
- [ ] Crear CI/CD pipeline (GitHub Actions)
- [ ] Containerizar con Docker
- [ ] Implementar centralized logging
- [ ] Configurar backups automáticos

### FASE 3: ÓPTIMO (Post-deployment)
- [ ] APM monitoring
- [ ] Performance optimization
- [ ] Security hardening avanzado

---

## 📝 COMANDOS RÁPIDOS

```bash
# Producción
npm run build
npm run start:prod

# Tests
npm run test:all

# Auditoria
npm audit

# Clean
npm run clean

# Development (solo después de Fase 1)
npm run dev
```

---

## ⚠️ CHECKLIST ANTES DE DEPLOYAR

```
SEGURIDAD:
[ ] npm audit → 0 vulnerabilidades
[ ] .env.production existe con secrets reales
[ ] .env.production en .gitignore
[ ] JWT_SECRET es fuerte (openssl rand -base64 32)
[ ] DB_PASSWORD es segura
[ ] CORS_ORIGIN correcto (no * en producción)

TESTING:
[ ] npm run test:smoke → PASS
[ ] npm run test:journey → PASS
[ ] npm run test:all → PASS

CÓDIGO:
[ ] npm run build → Sin errores
[ ] npm run lint → Sin errores
[ ] package.json actualizado

DEPLOYMENT:
[ ] Staging environment probado
[ ] Rollback plan documentado
[ ] Database backup realizado
[ ] Monitoring configurado (si aplica)
```

---

## 🚨 EN CASO DE PROBLEMAS

### "npm audit fix --force" falla
```bash
# Borrar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
npm audit fix --force
```

### TCP/IP no funciona después de habilitar
```bash
# Verificar que SQL Server escucha en 1433
netstat -ano | findstr :1433

# Si no aparece, reiniciar el servicio
net stop MSSQLSERVER
net start MSSQLSERVER
```

### Tests siguen fallando
```bash
# Verificar credenciales en .env.test
cat .env.test | grep DB_

# Conectarse manualmente para verificar
sqlcmd -S localhost -U sa -Q "SELECT @@VERSION"
```

---

## 📞 SOPORTE

Consult `PRODUCTION_AUDIT_REPORT.md` para análisis detallado de cada problema.

---

**Estimado**: 5 horas para Fase 1  
**Resultado**: 🟡 PRODUCCIÓN SEGURA (mínimo)  
**Próximo**: Implementar Fase 2 para producción robusta

