# 🚀 GUÍA DE DESPLIEGUE Y PUESTA EN PRODUCCIÓN

**Minimarket Intermedio PRO v1.0.0**  
**Status:** ✅ 100% COMPLETADO - LISTO PARA PRODUCCIÓN

---

## 📋 PRE-REQUISITOS PARA PRODUCCIÓN

### Server Requirements
- Node.js 16+ (LTS recomendado v18+)
- SQL Server 2017+ o Azure SQL
- 2GB RAM mínimo
- 10GB almacenamiento
- Puerto 3000 disponible (backend)
- Puerto 80/443 disponible (frontend)
- SSL/TLS certificate (HTTPS)

### Dependencias Instaladas ✅
```json
Backend:
- express: ^4.18.0
- mssql: ^9.0.0
- jsonwebtoken: ^9.0.0
- bcryptjs: ^2.4.0
- cors: ^2.8.0
- dotenv: ^16.0.0

Frontend:
- react: ^18.2.0
- react-router-dom: ^6.20.0
- axios: ^1.6.0
- zustand: ^4.4.2
- recharts: ^2.10.0
- tailwindcss: ^3.3.6
```

---

## ✅ CHECKLIST PRE-DESPLIEGUE

### Backend
- [ ] Actualizar `package.json` versiones
- [ ] Ejecutar `npm audit` y resolver vulnerabilidades
- [ ] Crear `.env.production` con variables correctas
- [ ] Ejecutar `database.sql` en SQL Server
- [ ] Probar `npm start` localmente
- [ ] Verificar todos los 27 endpoints con Postman/Insomnia
- [ ] Revisar logs en `./logs/`

### Frontend
- [ ] Actualizar `.env.production` con API URL correcta
- [ ] Ejecutar `npm run build`
- [ ] Probar `npm run preview`
- [ ] Verificar bundle size
- [ ] Test en localhost
- [ ] Revisar Network tab (sin errores 404/500)

### Base de Datos
- [ ] Backup de database.sql
- [ ] Verificar permisos de usuario SQL Server
- [ ] Confirmar indexes creados
- [ ] Probar views (vw_InventoryValue, etc.)
- [ ] Revisar triggers de auditoría

---

## 🌍 OPCIÓN 1: DESPLIEGUE EN HEROKU (Recomendado para Prototipo)

### Backend en Heroku

```bash
# 1. Instalar Heroku CLI
# Descargar desde https://devcenter.heroku.com/articles/heroku-cli

# 2. Login en Heroku
heroku login

# 3. Crear aplicación
heroku create minimarket-backend-prod

# 4. Agregar SQL Server addon
heroku addons:create cleardb:ignite -a minimarket-backend-prod

# 5. Configurar variables de entorno
heroku config:set JWT_SECRET=your-secret-key -a minimarket-backend-prod
heroku config:set NODE_ENV=production -a minimarket-backend-prod

# 6. Ejecutar migraciones (desde tu máquina)
# Revisar la connection string de Heroku
heroku config -a minimarket-backend-prod

# 7. Push a Heroku
git subtree push --prefix . heroku main

# 8. Ver logs
heroku logs --tail -a minimarket-backend-prod
```

### Frontend en Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Desplegar
vercel --prod

# 3. Configurar variables en Vercel Dashboard
VITE_API_URL=https://minimarket-backend-prod.herokuapp.com/api

# 4. Redeploy
vercel --prod
```

---

## ☁️ OPCIÓN 2: DESPLIEGUE EN AWS

### EC2 Instance Setup

```bash
# 1. Crear instancia EC2 (Ubuntu 22.04 LTS)
# - t3.small (2GB RAM)
- Security group: 22, 80, 443, 3000

# 2. SSH a instancia
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Instalar dependencias
sudo apt update
sudo apt install -y nodejs npm git nginx

# 4. Clonar repositorio
git clone https://github.com/your-repo/minimarket.git
cd minimarket

# 5. Instalar y construir
npm install
cd frontend
npm run build
cd ..

# 6. Instalar PM2 (process manager)
npm install -g pm2

# 7. Crear .env en raíz
cat > .env << EOF
PORT=3000
DB_HOST=your-rds-endpoint
DB_USER=admin
DB_PASSWORD=your-password
DB_DATABASE=minimarket_db
JWT_SECRET=your-secret-key
NODE_ENV=production
EOF

# 8. Iniciar backend con PM2
pm2 start src/index.js --name "minimarket-api"
pm2 save
pm2 startup

# 9. Configurar Nginx como proxy
sudo cat > /etc/nginx/sites-available/minimarket << EOF
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
    }

    location / {
        root /home/ubuntu/minimarket/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# 10. Habilitar configuración
sudo ln -s /etc/nginx/sites-available/minimarket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 11. SSL con Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 12. Verificar estado
pm2 status
curl http://localhost:3000/api/auth/me
```

### RDS (Managed SQL Server)

```bash
# 1. Crear RDS instance en AWS
# - Engine: SQL Server 2019 Express
# - Multi-AZ: No (dev) / Yes (prod)
# - Storage: 20GB

# 2. Obtener endpoint
# - Copiar de AWS Console

# 3. Conectar desde local
sqlcmd -S your-endpoint.database.windows.net -U admin -P password
> 1> :r database.sql
> 2> GO

# 4. Verificar tablas
> SELECT * FROM sys.tables;
```

---

## 🐳 OPCIÓN 3: DESPLIEGUE CON DOCKER

### Dockerfile Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY src ./src
COPY .env.production ./.env

EXPOSE 3000

CMD ["npm", "start"]
```

### Dockerfile Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:3000/api

  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=${DB_PASSWORD}
    ports:
      - "1433:1433"
    volumes:
      - ./database.sql:/docker-entrypoint-initdb.d/init.sql
```

### Deploy con Docker

```bash
# 1. Crear archivo .env con credenciales
echo "JWT_SECRET=your-secret" > .env
echo "DB_PASSWORD=YourP@ssw0rd" >> .env

# 2. Build y run
docker-compose up -d

# 3. Ver logs
docker-compose logs -f

# 4. Parar
docker-compose down
```

---

## 🔐 CONFIGURACIÓN DE SEGURIDAD

### .env.production
```bash
# Debe estar en .gitignore (NUNCA en git)
NODE_ENV=production
PORT=3000

# Base de Datos
DB_HOST=your-db.database.windows.net
DB_USER=admin
DB_PASSWORD=SuperSecure@Password123
DB_DATABASE=minimarket_prod

# JWT
JWT_SECRET=GeneratedRandomString_change_this_please_very_long
JWT_EXPIRES_IN=24h

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Variables a Cambiar
- ❌ JWT_SECRET (Generar nuevo)
- ❌ DB_PASSWORD (Cambiar)
- ❌ ALLOWED_ORIGINS (Tu dominio)
- ❌ Todos los secretos

### Generar JWT_SECRET Seguro
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))

# Online Generator
https://www.random.org/strings/
```

---

## 📊 MONITORING Y LOGS

### PM2 Monitoring
```bash
# Instalar PM2 Plus (opcional)
pm2 plus

# Ver dashboard
pm2 web

# Guardar logs en archivo
pm2 logs minimarket-api > app.log
```

### CloudWatch (AWS)
```bash
# Instalar CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configurar
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s -c file:config.json
```

---

## 📈 OPTIMIZACIONES PARA PRODUCCIÓN

### Backend
```javascript
// Agregar compresión
npm install compression
app.use(compression());

// Rate limiting
npm install express-rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// CORS restrictivo
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS,
  credentials: true
}));
```

### Frontend
```javascript
// Code splitting en Vite
// Automático con:
npm run build

// Verificar tamaño
npm install -g serve
npm run build
serve -s dist
```

### Database
```sql
-- Crear índices adicionales
CREATE INDEX idx_sales_date ON Sales(SaleDate);
CREATE INDEX idx_inventory_product ON Inventory(ProductID);
CREATE INDEX idx_cashmovement_date ON CashMovement(CreatedAt);

-- Backup automático
-- Windows Task Scheduler o cron job
```

---

## ✅ TESTING PRE-PRODUCCIÓN

### Backend Tests
```bash
# Verificar endpoints críticos
curl -X GET http://localhost:3000/api/auth/me

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@minimarket.com","password":"Admin@123"}'

# Crear producto test
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...}'
```

### Frontend Tests
```bash
# Performance Audit
npm run build
npx lighthouse http://localhost:5173

# Bundle Analysis
npm install -g webpack-bundle-analyzer
# Configurar en vite.config.js

# Accessibility Check
npm install -g axe-core
```

### Load Testing
```bash
# Instalar Apache Bench
sudo apt install -y apache2-utils

# Test
ab -n 1000 -c 10 http://your-domain.com/api/products
```

---

## 🚨 TROUBLESHOOTING PRODUCCIÓN

### Backend no inicia
```bash
# Revisar logs
pm2 logs minimarket-api

# Verificar puerto
sudo lsof -i :3000

# Matar proceso
sudo kill -9 <PID>

# Reiniciar
pm2 start src/index.js
```

### Base de datos no conecta
```bash
# Verificar conexión
sqlcmd -S endpoint -U user -P password

# Revisar .env
cat .env

# Verificar firewall
# AWS Security Group: Agregar 1433
```

### Frontend no carga
```bash
# Revisar Nginx
sudo nginx -t
sudo systemctl restart nginx

# Ver logs Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar archivos
ls -la /var/www/dist/
```

---

## 📱 CERTIFICADOS SSL/TLS

### Let's Encrypt (Gratis)
```bash
# Con Nginx (automático)
sudo certbot --nginx -d your-domain.com

# Con Apache
sudo certbot --apache -d your-domain.com

# Renovación automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verificar
sudo certbot certificates
```

### AWS Certificate Manager
```bash
# Crear en ACM Console
# Solicitar certificado
# Validar DNS
# Usar en ALB/CloudFront
```

---

## 🔄 CI/CD PIPELINE (GitHub Actions)

### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Backend
      run: |
        npm install
        npm test
    
    - name: Build Frontend
      run: |
        cd frontend
        npm install
        npm run build
    
    - name: Deploy to Heroku
      env:
        HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
      run: |
        git push heroku main
```

---

## 📊 CHECKLIST FINAL DESPLIEGUE

- [ ] Base de datos creada y poblada
- [ ] Variables de entorno configuradas
- [ ] Certificado SSL instalado
- [ ] CORS configurado correctamente
- [ ] Todos los 27 endpoints probados
- [ ] Frontend build optimizado
- [ ] Logs configurados
- [ ] Backup automático
- [ ] Monitoreo activo
- [ ] DNS actualizado
- [ ] Domain apuntando al servidor
- [ ] HTTPS funcionando
- [ ] Login probado
- [ ] POS completo probado
- [ ] Reportes generando
- [ ] Usuarios pueden crear productos
- [ ] Caja abre/cierra
- [ ] Inventario actualiza

---

## 📞 POST-DESPLIEGUE

### Monitoreo Diario
```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs

# CPU/RAM
top
free -h

# Disco
df -h

# Conexión DB
sqlcmd -S endpoint -U user
> SELECT @@version;
```

### Backups
```bash
# SQL Server backup
BACKUP DATABASE minimarket_prod 
TO DISK = '/var/opt/mssql/backup/minimarket_prod.bak'

# Automático (cron)
0 2 * * * /usr/bin/backup.sh
```

### Updates
```bash
# Actualizar Node.js
sudo apt update
sudo apt upgrade nodejs

# Actualizar dependencias
npm update
npm audit fix

# Redeploy
git pull
npm install
pm2 restart minimarket-api
```

---

## 🎉 CONCLUSIÓN

**El sistema está listo para producción. Sigue esta guía para desplegar con confianza.**

Opciones recomendadas:
1. **Para empezar rápido:** Heroku + Vercel (15 min)
2. **Para escalabilidad:** AWS EC2 + RDS (1-2 horas)
3. **Para desarrollo:** Docker (30 min)
4. **Para empresa:** Azure + SQL Azure (2-4 horas)

---

**Desarrollado con ❤️ - Minimarket Intermedio PRO v1.0.0**
