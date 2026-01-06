# 🎯 Guía de Ambientes - Materi App

## 🌐 TUS URLs

### PRODUCCIÓN (App en vivo - usuarios reales)
**Frontend:**
- ✅ **URL OFICIAL**: https://materi-app-eight.vercel.app
- Dashboard: https://vercel.com/dashboard

**Backend:**
- URL: https://materi-app.onrender.com
- Health: https://materi-app.onrender.com/health

### DESARROLLO (Tu espacio de pruebas)
**Frontend:**
- URL: http://localhost:5173
- Iniciar: `npm run dev`

**Backend:**
- URL: http://localhost:4000
- Iniciar: `cd materi-backend && node index.js`

---

## 🔄 ¿Cómo Funciona el Flujo?

### Paso a Paso:

```
📝 1. PROGRAMÁS en tu computadora (localhost)
      ├─ Hacés cambios en los archivos
      ├─ Ves los cambios en http://localhost:5173
      └─ Probás que todo funcione bien

💾 2. GUARDÁS los cambios
      ├─ git add .
      ├─ git commit -m "descripción"
      └─ git push

⚡ 3. DESPLIEGUE AUTOMÁTICO (no hacés nada)
      ├─ Vercel detecta el push
      ├─ Construye la nueva versión
      ├─ La sube a producción AUTOMÁTICAMENTE
      └─ Render también se actualiza si hay cambios en backend

✅ 4. PRODUCCIÓN ACTUALIZADA
      └─ Tus usuarios ven los cambios en la URL de Vercel
```

---

## 🛠️ ¿Qué Modificar en Cada Ambiente?

### LOCALHOST (Desarrollo)
✅ **SÍ modificás:**
- Código de React (archivos .jsx)
- Estilos CSS
- Backend (index.js, schema.prisma)
- Cualquier archivo del proyecto

❌ **NO afecta:**
- A los usuarios
- A la base de datos de producción
- A la app en vivo

### PRODUCCIÓN (Vercel/Render)
❌ **NO modificás NADA directamente**

✅ **Se actualiza SOLO cuando:**
- Hacés `git push`
- Vercel construye automáticamente
- Render redespliega automáticamente

---

## 📊 Variables de Entorno

### Desarrollo (.env)
```bash
VITE_API_URL=http://localhost:4000
```

### Producción (.env.production)
```bash
VITE_API_URL=https://materi-app.onrender.com
```

**Importante:** Las variables de producción están configuradas en:
- Vercel Dashboard → Settings → Environment Variables
- Render Dashboard → Environment

---

## 🚀 Comandos Comunes

### Desarrollo Local
```bash
# Frontend
npm run dev                    # Inicia en localhost:5173

# Backend
cd materi-backend
node index.js                  # Inicia en localhost:4000
```

### Subir a Producción
```bash
git add .
git commit -m "Descripción de cambios"
git push                       # Esto actualiza producción automáticamente
```

### Ver Logs de Producción
- **Vercel**: https://vercel.com/dashboard → tu proyecto → Deployments
- **Render**: https://dashboard.render.com → tu servicio → Logs

---

## 🎓 Ejemplo Práctico

### Quiero agregar un botón nuevo:

1. **Desarrollo:**
   ```bash
   npm run dev  # Abrir localhost:5173
   # Editar el archivo .jsx
   # Ver el cambio en el navegador
   # Probar que funciona
   ```

2. **Subir a Producción:**
   ```bash
   git add .
   git commit -m "Agregué botón de ayuda"
   git push
   # Esperar 1-2 minutos
   # Verificar en tu URL de Vercel
   ```

3. **Listo!** El botón ya está visible para todos los usuarios

---

## ❓ Preguntas Frecuentes

**¿Cuándo debo usar localhost?**
- Siempre que estés programando

**¿Cuándo debo usar la URL de Vercel?**
- Para compartir la app con usuarios
- Para probar la versión final
- Para mostrarle a alguien tu trabajo

**¿Los cambios en localhost afectan a producción?**
- NO, hasta que hagas `git push`

**¿Cómo sé si mi código está en producción?**
- Hacé `git push` y esperá 1-2 minutos
- Andá a tu URL de Vercel
- Deberías ver los cambios

**¿Qué pasa si rompo algo en producción?**
- Podés hacer `git revert` para volver atrás
- O arreglar el bug y hacer otro `git push`

---

## 🔍 Encontrar tu URL de Vercel

1. Andá a: https://vercel.com/dashboard
2. Hacé login
3. Buscá "materi-app" en tus proyectos
4. Copiá la URL que aparece
5. ¡Guardala para siempre!

**Probá estas URLs directamente:**
- https://materi-app.vercel.app
- https://materi-app-backhaus7997.vercel.app

Una de esas debería funcionar.
