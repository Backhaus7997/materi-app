# Materi – Guía para Desarrolladores

Este proyecto está dividido en dos partes:

- **materi-backend** → API REST (Node.js + Express + Prisma + SQLite)  
- **materi-app** → Frontend (Vite + React)

Este documento está pensado para desarrolladores e incluye únicamente:

- Requisitos
- Instalación y arranque en entorno de desarrollo

---

## 🧾 Requisitos

### Generales

- **Node.js**: versión **18 o superior**  
  Verificar versión instalada:

  ```bash
  node -v
npm: versión 8 o superior

bash

npm -v
Git: para clonar el repositorio

Recomendado
VS Code u otro editor de código

Extensión Thunder Client (VS Code) o Postman para probar la API

Navegador moderno (Chrome / Edge / Firefox)

📂 Estructura del proyecto
text

materi/
├─ materi-backend/   # Backend (API REST: Node + Express + Prisma + SQLite)
└─ materi-app/       # Frontend (Vite + React)
⚙️ Instalación y Setup
1. Clonar el repositorio
bash

git clone <URL_DEL_REPO>
cd materi
Reemplazá <URL_DEL_REPO> por la URL real de tu repositorio (HTTPS o SSH).

🔙 Backend – materi-backend
2. Instalación de dependencias
Desde la raíz del proyecto:

bash

cd materi-backend
npm install
Esto instala todas las dependencias necesarias del backend (Express, Prisma, etc.).

3. Variables de entorno
Crear un archivo .env dentro de materi-backend con al menos:

env

DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia-esto-por-algo-mas-seguro"
NODE_ENV="development"
PORT=4000
DATABASE_URL → ruta del archivo SQLite (modo desarrollo).

JWT_SECRET → clave usada para firmar los JWT. En desarrollo puede ser cualquier string.

NODE_ENV → normalmente "development" para entorno local.

PORT → puerto donde va a correr el backend.

4. Migrar la base de datos (Prisma)
Ejecutar las migraciones de Prisma para crear/actualizar la base de datos dev.db:

bash

npx prisma migrate dev --name init
Si el proyecto ya tiene migraciones existentes, Prisma las aplicará en orden automáticamente.

Opcional: abrir Prisma Studio para inspeccionar la base de datos en modo visual:

bash

npx prisma studio
5. Levantar el backend
Con las dependencias instaladas, el .env creado y las migraciones aplicadas:

bash

npm start
Por defecto, la API queda disponible en:

text

http://localhost:4000
Prueba rápida (opcional):

bash

curl http://localhost:4000/health
Deberías recibir un JSON indicando que el backend está funcionando.

🖥️ Frontend – materi-app
Abrir otra terminal desde la raíz del proyecto (materi/).

6. Instalación de dependencias
bash

cd materi-app
npm install
Esto instala todas las dependencias del frontend (React, Vite, React Query, etc.).

7. Variables de entorno
Crear un archivo .env dentro de materi-app con:

env

VITE_API_URL="http://localhost:4000"
VITE_API_URL debe apuntar a la URL del backend en desarrollo.
Si cambiaste el puerto o el host del backend, actualizalo acá.

8. Levantar el frontend
Con dependencias instaladas y .env configurado:

bash

npm run dev
Por defecto, Vite levanta el frontend en:

text

http://localhost:5173
Abrí esa URL en tu navegador.

▶️ Resumen de arranque rápido
Backend

bash

cd materi-backend
npm install
# crear y configurar .env
npx prisma migrate dev --name init
npm start
Frontend (en otra terminal)

bash

cd materi-app
npm install
# crear y configurar .env
npm run dev
Navegador

Abrir:

text

http://localhost:5173
Con estos pasos cualquier desarrollador puede clonar el repositorio y levantar Materi en modo desarrollo.