# Guía de Despliegue en Railway

## 📋 Pasos para desplegar tu backend en Railway

### 1. Crear cuenta y proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión con GitHub
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Elige el repositorio `materi-app`

### 2. Agregar PostgreSQL Database

1. En tu proyecto de Railway, haz clic en "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway creará automáticamente la base de datos y generará las variables:
   - `DATABASE_URL`
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### 3. Configurar Variables de Entorno

En tu servicio de Railway, ve a la pestaña "Variables" y agrega:

```
NODE_ENV=production
JWT_SECRET=tu-secreto-super-seguro-aqui-cambialo
FRONTEND_URL=https://materi-app-eight.vercel.app
LOG_LEVEL=info
```

**IMPORTANTE**:
- Railway ya configura automáticamente `DATABASE_URL` y `PORT`
- Genera un JWT_SECRET seguro (puedes usar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 4. La base de datos se migrará automáticamente

El archivo `nixpacks.toml` está configurado para:
- Instalar dependencias
- Generar el cliente de Prisma
- **Ejecutar migraciones automáticamente** con `prisma migrate deploy`

### 5. Obtener la URL de tu backend

1. Una vez desplegado, Railway te dará una URL como: `https://tu-proyecto.up.railway.app`
2. Copia esta URL

### 6. Actualizar el Frontend en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Actualiza `VITE_API_URL` con tu nueva URL de Railway:
   ```
   VITE_API_URL=https://tu-proyecto.up.railway.app
   ```
4. Redeploya el frontend

### 7. Actualizar CORS en Railway (si es necesario)

Si tienes otra URL de frontend, actualiza la variable en Railway:
```
FRONTEND_URL=https://tu-frontend.vercel.app
```

## ✅ Verificación

1. Visita `https://tu-proyecto.up.railway.app/health` - deberías ver:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "environment": "production"
   }
   ```

2. Verifica que el frontend se conecte correctamente

## 🔧 Troubleshooting

### Error: "DATABASE_URL not found"
- Verifica que agregaste PostgreSQL a tu proyecto
- Revisa que la variable esté en la pestaña "Variables"

### Error: "JWT_SECRET no está configurado"
- Agrega la variable `JWT_SECRET` en Railway

### Error de CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que la URL del frontend sea exacta (sin "/" al final)

### Migraciones no se ejecutan
- Revisa los logs de deployment en Railway
- Las migraciones se ejecutan automáticamente en la fase de build

## 📝 Notas Importantes

- Railway usa Nixpacks para detectar y buildear tu app automáticamente
- El archivo `nixpacks.toml` configura el proceso de build
- Las migraciones de Prisma se ejecutan automáticamente en cada deploy
- Railway proporciona 500 horas gratis al mes (suficiente para desarrollo)

## 🚀 Próximos Pasos

Una vez desplegado exitosamente:
1. Prueba todas las funcionalidades (login, registro, productos, cotizaciones)
2. Monitorea los logs en Railway para detectar errores
3. Configura un dominio personalizado (opcional)
