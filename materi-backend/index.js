// materi-backend/index.js
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
  origin: 'http://localhost:5173',
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
        user_role: user_role || 'Supplier',
      },
    });

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
    console.error('Error POST /auth/register', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

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

// ---------- PRODUCTS ----------

app.get('/products', async (req, res) => {
  try {
    const { supplier_id, active, search, category, id } = req.query;
    const where = {};

    if (id) {
      where.id = id;
    }

    if (supplier_id) {
      where.supplierId = supplier_id;
    }

    if (active !== undefined) {
      where.active = active === 'true' || active === '1';
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { internal_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (err) {
    console.error('Error GET /products', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (err) {
    console.error('Error GET /products/:id', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

app.post('/products', async (req, res) => {
  try {
    const data = req.body;

    if (!data.supplier_id) {
      return res.status(400).json({ error: 'supplier_id es requerido' });
    }

    const basePrice =
      data.base_price !== undefined && data.base_price !== null
        ? Number(data.base_price)
        : 0;

    const product = await prisma.product.create({
      data: {
        supplierId: data.supplier_id,
        supplier_name: data.supplier_name || null,
        name: data.name,
        internal_code: data.internal_code || null,
        description: data.description || null,
        image_url: data.image_url || null,
        category: data.category || null,
        unit_of_measure: data.unit_of_measure || 'unit',
        base_price: isNaN(basePrice) ? 0 : basePrice,
        currency: data.currency || 'USD',
        active: data.active ?? true,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Error POST /products', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.patch('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.internal_code !== undefined) updateData.internal_code = data.internal_code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.unit_of_measure !== undefined) updateData.unit_of_measure = data.unit_of_measure;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.supplier_id !== undefined) updateData.supplierId = data.supplier_id;
    if (data.supplier_name !== undefined) updateData.supplier_name = data.supplier_name;

    if (data.base_price !== undefined) {
      const basePrice = Number(data.base_price);
      updateData.base_price = isNaN(basePrice) ? 0 : basePrice;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.json(product);
  } catch (err) {
    console.error('Error PATCH /products/:id', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (err) {
    console.error('Error DELETE /products/:id', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// ---------- CARTS ----------

// GET /carts?vendor_id=...&id=...
app.get('/carts', async (req, res) => {
  try {
    const { vendor_id, id } = req.query;
    const where = {};

    if (id) where.id = id;
    if (vendor_id) where.vendorId = vendor_id;

    const carts = await prisma.cart.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(carts);
  } catch (err) {
    console.error('Error GET /carts', err);
    res.status(500).json({ error: 'Error al obtener carritos' });
  }
});

// POST /carts
app.post('/carts', async (req, res) => {
  try {
    const data = req.body;

    if (!data.vendor_id) {
      return res.status(400).json({ error: 'vendor_id es requerido' });
    }

    const cart = await prisma.cart.create({
      data: {
        vendorId: data.vendor_id,
        global_margin_percent:
          data.global_margin_percent !== undefined && data.global_margin_percent !== null
            ? Number(data.global_margin_percent)
            : 20,
      },
    });

    res.status(201).json(cart);
  } catch (err) {
    console.error('Error POST /carts', err);
    res.status(500).json({ error: 'Error al crear carrito' });
  }
});

// PATCH /carts/:id
app.patch('/carts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData = {};

    if (data.vendor_id !== undefined) updateData.vendorId = data.vendor_id;
    if (data.global_margin_percent !== undefined) {
      const v = Number(data.global_margin_percent);
      updateData.global_margin_percent = isNaN(v) ? 20 : v;
    }

    const cart = await prisma.cart.update({
      where: { id },
      data: updateData,
    });

    res.json(cart);
  } catch (err) {
    console.error('Error PATCH /carts/:id', err);
    res.status(500).json({ error: 'Error al actualizar carrito' });
  }
});

// ---------- CART ITEMS ----------

// GET /cart-items?vendor_id=...&product_id=...&cart_id=...&supplier_id=...
app.get('/cart-items', async (req, res) => {
  try {
    const { vendor_id, product_id, cart_id, supplier_id } = req.query;
    const where = {};

    if (vendor_id) where.vendorId = vendor_id;
    if (product_id) where.productId = product_id;
    if (cart_id) where.cartId = cart_id;
    if (supplier_id) where.supplierId = supplier_id;

    const items = await prisma.cartItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(items);
  } catch (err) {
    console.error('Error GET /cart-items', err);
    res.status(500).json({ error: 'Error al obtener items del carrito' });
  }
});

// POST /cart-items
app.post('/cart-items', async (req, res) => {
  try {
    const data = req.body;

    if (!data.cart_id) {
      return res.status(400).json({ error: 'cart_id es requerido' });
    }
    if (!data.product_id) {
      return res.status(400).json({ error: 'product_id es requerido' });
    }

    const quantity =
      data.quantity !== undefined && data.quantity !== null
        ? Number(data.quantity)
        : 1;
    const unitCost =
      data.unit_cost_price !== undefined && data.unit_cost_price !== null
        ? Number(data.unit_cost_price)
        : 0;

    const item = await prisma.cartItem.create({
      data: {
        cartId: data.cart_id,
        vendorId: data.vendor_id || null,
        supplierId: data.supplier_id || null,
        supplier_name: data.supplier_name || null,
        productId: data.product_id,
        product_name: data.product_name || null,
        product_description: data.product_description || null,
        product_image_url: data.product_image_url || null,
        unit_of_measure: data.unit_of_measure || null,
        quantity: isNaN(quantity) ? 1 : quantity,
        unit_cost_price: isNaN(unitCost) ? 0 : unitCost,
        margin_percent:
          data.margin_percent !== undefined && data.margin_percent !== null
            ? Number(data.margin_percent)
            : null,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Error POST /cart-items', err);
    res.status(500).json({ error: 'Error al crear item de carrito' });
  }
});

// PATCH /cart-items/:id
app.patch('/cart-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData = {};

    if (data.cart_id !== undefined) updateData.cartId = data.cart_id;
    if (data.vendor_id !== undefined) updateData.vendorId = data.vendor_id;
    if (data.supplier_id !== undefined) updateData.supplierId = data.supplier_id;
    if (data.supplier_name !== undefined) updateData.supplier_name = data.supplier_name;
    if (data.product_id !== undefined) updateData.productId = data.product_id;
    if (data.product_name !== undefined) updateData.product_name = data.product_name;
    if (data.product_description !== undefined) updateData.product_description = data.product_description;
    if (data.product_image_url !== undefined) updateData.product_image_url = data.product_image_url;
    if (data.unit_of_measure !== undefined) updateData.unit_of_measure = data.unit_of_measure;

    if (data.quantity !== undefined) {
      const q = Number(data.quantity);
      updateData.quantity = isNaN(q) ? 1 : q;
    }

    if (data.unit_cost_price !== undefined) {
      const u = Number(data.unit_cost_price);
      updateData.unit_cost_price = isNaN(u) ? 0 : u;
    }

    if (data.margin_percent !== undefined) {
      updateData.margin_percent =
        data.margin_percent === null
          ? null
          : (isNaN(Number(data.margin_percent)) ? null : Number(data.margin_percent));
    }

    const item = await prisma.cartItem.update({
      where: { id },
      data: updateData,
    });

    res.json(item);
  } catch (err) {
    console.error('Error PATCH /cart-items/:id', err);
    res.status(500).json({ error: 'Error al actualizar item de carrito' });
  }
});

// DELETE /cart-items/:id
app.delete('/cart-items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cartItem.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (err) {
    console.error('Error DELETE /cart-items/:id', err);
    res.status(500).json({ error: 'Error al eliminar item de carrito' });
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