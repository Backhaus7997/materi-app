// index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-super-inseguro';
const JWT_EXPIRES_IN = '7d';

// ---------- Middlewares base ----------

app.use(cors({
  origin: 'http://localhost:5173', // tu frontend
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ---------- Helpers ----------

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      user_role: user.user_role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Cómo devolvemos el usuario al frontend (nombres de campos amigables)
function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    user_role: user.user_role,
    supplier_id: user.supplierId || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Middleware para leer el usuario desde la cookie
async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });
    req.user = user;
  } catch (err) {
    console.error('Error verificando token:', err.message);
    req.user = null;
  }
  next();
}

app.use(authMiddleware);

// ---------- Rutas básicas ----------

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend de Materi funcionando 🚀' });
});

// ---------- AUTH ----------

// Registrar usuario
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, user_role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email y password son requeridos' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        user_role: user_role || 'Supplier', // por ahora default Supplier para probar ese flujo
      },
    });

    const token = createToken(user);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.json(toPublicUser(user));
  } catch (err) {
    console.error('Error POST /auth/register', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = createToken(user);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(toPublicUser(user));
  } catch (err) {
    console.error('Error POST /auth/login', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Quién soy
app.get('/auth/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ user: null });
    }
    res.json(toPublicUser(req.user));
  } catch (err) {
    console.error('Error GET /auth/me', err);
    res.status(500).json({ error: 'Error al obtener usuario actual' });
  }
});

// Actualizar datos propios (incluye supplier_id)
app.patch('/auth/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { name, supplier_id, user_role } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ?? req.user.name,
        user_role: user_role ?? req.user.user_role,
        supplierId: supplier_id ?? req.user.supplierId,
      },
    });

    res.json(toPublicUser(updated));
  } catch (err) {
    console.error('Error PATCH /auth/me', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Logout
app.post('/auth/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });
  res.json({ ok: true });
});

// ---------- SUPPLIERS ----------

// GET /suppliers?active=true&id=...
app.get('/suppliers', async (req, res) => {
  try {
    const { active, id } = req.query;
    const where = {};

    if (active !== undefined) {
      where.active = active === 'true' || active === '1';
    }

    if (id) {
      where.id = id;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(suppliers);
  } catch (err) {
    console.error('Error GET /suppliers', err);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// POST /suppliers
app.post('/suppliers', async (req, res) => {
  try {
    const data = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        company_name: data.company_name || null,
        contact_person: data.contact_person || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        payment_terms: data.payment_terms || null,
        active: data.active ?? true,
      },
    });

    res.status(201).json(supplier);
  } catch (err) {
    console.error('Error POST /suppliers', err);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// PATCH /suppliers/:id
app.patch('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    res.json(supplier);
  } catch (err) {
    console.error('Error PATCH /suppliers/:id', err);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

// DELETE /suppliers/:id
app.delete('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.supplier.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (err) {
    console.error('Error DELETE /suppliers/:id', err);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

// ---------- Shutdown ordenado ----------

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`✅ API escuchando en http://localhost:${PORT}`);
});
