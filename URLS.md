# URLs de Materi App

## Producción (EN VIVO - No necesitás localhost)

### Frontend (Vercel)
- URL: Buscá en tu dashboard de Vercel → https://vercel.com/dashboard
- Formato típico: `https://materi-app.vercel.app`

### Backend (Render)
- URL: https://materi-app.onrender.com
- Health Check: https://materi-app.onrender.com/health

## Desarrollo Local (Solo para programar)

### Frontend
- URL: http://localhost:5173
- Comando: `npm run dev`

### Backend
- URL: http://localhost:4000
- Comando: `cd materi-backend && node index.js`

---

## ¿Cómo acceder a tu aplicación?

**Para usarla normalmente (sin programar):**
1. Andá a Vercel y buscá la URL de tu proyecto
2. Entrá a esa URL desde cualquier navegador
3. ¡Listo! No necesitás localhost ni npm ni nada

**Para programar y hacer cambios:**
1. Usá localhost:5173 para ver los cambios en tiempo real
2. Cuando termines, hacé git push y Vercel se actualiza automáticamente
