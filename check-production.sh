#!/bin/bash

echo "🔍 Verificando estado de producción..."
echo ""

echo "📡 Backend (Render):"
BACKEND_HEALTH=$(curl -s https://materi-app.onrender.com/health 2>&1)
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    echo "✅ Backend funcionando correctamente"
    echo "$BACKEND_HEALTH" | python -m json.tool
else
    echo "❌ Backend no responde correctamente"
    echo "$BACKEND_HEALTH"
fi

echo ""
echo "🌐 Frontend (Vercel):"
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" https://materi-app-eight.vercel.app)
if [ "$FRONTEND" = "200" ]; then
    echo "✅ Frontend funcionando (HTTP $FRONTEND)"
else
    echo "❌ Frontend con problemas (HTTP $FRONTEND)"
fi

echo ""
echo "📊 Resumen:"
echo "- Backend: https://materi-app.onrender.com/health"
echo "- Frontend: https://materi-app-eight.vercel.app"
