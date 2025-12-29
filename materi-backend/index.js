// materi-backend/index.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const winston = require("winston");
const { createId } = require("@paralleldrive/cuid2");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

// ✅ Configuración de Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "materi-backend" },
  transports: [
    // Escribir logs de error a archivo
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    // Escribir todos los logs a archivo combinado
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// En desarrollo, también mostrar logs en consola con formato más legible
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

const prisma = new PrismaClient();
const app = express();

// Validar JWT_SECRET en producción
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET no está configurado");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
  logger.warn("Usando JWT_SECRET por defecto (solo desarrollo)");
}
const JWT_EXPIRES_IN = "7d";

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => logger.info(`Server running on port ${PORT}`));

// ---------- Middlewares base ----------
logger.info(`Materi Backend initialized - File: ${__filename}`);

// ✅ Helmet para headers de seguridad HTTP
app.use(helmet());

// ✅ Rate limiting para protección contra ataques
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: { error: "Demasiados intentos. Por favor, intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: { error: "Demasiadas peticiones. Por favor, intenta de nuevo más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://materi-app-eight.vercel.app",
  process.env.FRONTEND_URL, // opcional
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman/Thunder
    const ok = allowedOrigins.includes(origin);
    return cb(null, ok); // NO tirar Error
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ CORS único
app.use(cors(corsOptions));

// ✅ Preflight único (usa exactamente las mismas opciones)
app.options("*", cors(corsOptions));

// ✅ Rate limiting general
app.use(generalLimiter);

app.use(express.json({ limit: "10mb" }));
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

function formatQuoteNumber(n) {
  return `Q-${String(n).padStart(6, "0")}`;
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

// ---------- Quote Number (Q-000001, Q-000002, ...) ----------
// Se genera SIEMPRE en backend (atómico) para evitar duplicados.
// (dejé solo una función formatQuoteNumber arriba)

// ---------- Auth middleware ----------
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
    logger.warn("Error verificando token", { error: err.message });
    req.user = null;
  }
  next();
}

app.use(authMiddleware);

// ---------- HEALTH CHECK ----------
app.get("/health", async (req, res) => {
  try {
    // Verificar conexión a base de datos
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    logger.error("Health check failed", { error: err.message, stack: err.stack });
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: err.message,
    });
  }
});

app.patch("/auth/me", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
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
    console.error("Error PATCH /auth/me", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

app.post("/auth/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
  res.json({ ok: true });
});

app.post("/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, user_role, supplier_id } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email y password son requeridos" });
    }

    // Validar formato de email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "El formato del email no es válido" });
    }

    // Validar longitud mínima de password
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Normalizar email (lowercase y trim)
    const normalizedEmail = validator.normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: createId(),
        name: validator.trim(name),
        email: normalizedEmail,
        passwordHash,
        user_role: user_role || "vendor",
        supplierId: supplier_id || null,
      },
    });

    const token = createToken(user);
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    console.error("Error POST /auth/register", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

app.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email y password son requeridos" });
    }

    // Validar formato de email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "El formato del email no es válido" });
    }

    // Normalizar email para búsqueda consistente
    const normalizedEmail = validator.normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = createToken(user);
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    console.error("Error POST /auth/login", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// ---------- SUPPLIERS ----------

app.get("/suppliers", async (req, res) => {
  try {
    const { active, id, page, limit } = req.query;
    const where = {};

    if (active !== undefined) {
      where.active = active === "true" || active === "1";
    }

    if (id) where.id = id;

    // Paginación
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      data: suppliers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("Error GET /suppliers", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

app.post("/suppliers", async (req, res) => {
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
    console.error("Error POST /suppliers", err);
    res.status(500).json({ error: "Error al crear proveedor" });
  }
});

app.patch("/suppliers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    res.json(supplier);
  } catch (err) {
    console.error("Error PATCH /suppliers/:id", err);
    res.status(500).json({ error: "Error al actualizar proveedor" });
  }
});

app.delete("/suppliers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.supplier.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (err) {
    console.error("Error DELETE /suppliers/:id", err);
    res.status(500).json({ error: "Error al eliminar proveedor" });
  }
});

// ---------- PRODUCTS ----------

app.get("/products", async (req, res) => {
  try {
    const { supplier_id, active, search, category, id, page, limit } = req.query;
    const where = {};

    if (id) where.id = id;
    if (supplier_id) where.supplierId = supplier_id;

    if (active !== undefined) {
      where.active = active === "true" || active === "1";
    }

    if (category) where.category = category;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { internal_code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Paginación
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("Error GET /products", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error GET /products/:id", err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

app.post("/products", async (req, res) => {
  try {
    const data = req.body;

    if (!data.supplier_id) {
      return res.status(400).json({ error: "supplier_id es requerido" });
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
        unit_of_measure: data.unit_of_measure || "unit",
        base_price: isNaN(basePrice) ? 0 : basePrice,
        currency: data.currency || "USD",
        active: data.active ?? true,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Error POST /products", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

app.patch("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.internal_code !== undefined) updateData.internal_code = body.internal_code ?? null;
    if (body.description !== undefined) updateData.description = body.description ?? null;
    if (body.category !== undefined) updateData.category = body.category ?? null;
    if (body.image_url !== undefined) updateData.image_url = body.image_url ?? null;

    if (body.unit_of_measure !== undefined) {
      updateData.unit_of_measure = body.unit_of_measure || "unit";
    }
    if (body.currency !== undefined) {
      updateData.currency = body.currency || "USD";
    }

    if (body.supplier_id !== undefined) {
      if (body.supplier_id) updateData.supplierId = body.supplier_id;
    }
    if (body.supplier_name !== undefined) {
      updateData.supplier_name = body.supplier_name ?? null;
    }

    if (body.base_price !== undefined) {
      const basePrice = Number(body.base_price);
      if (Number.isNaN(basePrice)) {
        return res.status(400).json({ error: "base_price debe ser numérico" });
      }
      updateData.base_price = basePrice;
    }

    if (body.active !== undefined) {
      if (typeof body.active === "string") {
        updateData.active = body.active === "true" || body.active === "1";
      } else {
        updateData.active = !!body.active;
      }
    }

    if (Object.keys(updateData).length === 0) {
      const current = await prisma.product.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ error: "Producto no encontrado" });
      return res.json(current);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.json(product);
  } catch (err) {
    console.error("Error PATCH /products/:id", err);
    res.status(500).json({
      error: "Error al actualizar producto",
      detail: err.message,
    });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });

    res.status(204).end();
  } catch (err) {
    console.error("Error DELETE /products/:id", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// ---------- CARTS ----------

app.get("/carts", async (req, res) => {
  try {
    const { vendor_id, id } = req.query;
    const where = {};

    if (id) where.id = id;
    if (vendor_id) where.vendorId = vendor_id;

    const carts = await prisma.cart.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(carts);
  } catch (err) {
    console.error("Error GET /carts", err);
    res.status(500).json({ error: "Error al obtener carritos" });
  }
});

app.post("/carts", async (req, res) => {
  try {
    const data = req.body;

    if (!data.vendor_id) {
      return res.status(400).json({ error: "vendor_id es requerido" });
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
    console.error("Error POST /carts", err);
    res.status(500).json({ error: "Error al crear carrito" });
  }
});

app.patch("/carts/:id", async (req, res) => {
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
    console.error("Error PATCH /carts/:id", err);
    res.status(500).json({ error: "Error al actualizar carrito" });
  }
});

// ---------- CART ITEMS ----------

app.get("/cart-items", async (req, res) => {
  try {
    const { vendor_id, product_id, cart_id, supplier_id } = req.query;
    const where = {};

    if (vendor_id) where.vendorId = vendor_id;
    if (product_id) where.productId = product_id;
    if (cart_id) where.cartId = cart_id;
    if (supplier_id) where.supplierId = supplier_id;

    const items = await prisma.cartItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id:true, name:true, company_name:true, phone:true, email:true } },
        product: { select: { id:true, name:true, supplierId:true, supplier_name:true, unit_of_measure:true, base_price:true, currency:true } },
      },
    });

res.json(items.map(i => ({ ...i, supplier_phone: i?.supplier?.phone || null })));

  } catch (err) {
    console.error("Error GET /cart-items", err);
    res.status(500).json({ error: "Error al obtener items del carrito" });
  }
});

app.post('/cart-items', async (req, res) => {
  try {
    // ✅ soporta body plano o envuelto en { data: ... }
    const body = (req.body && req.body.data) ? req.body.data : (req.body || {});

    console.log('POST /cart-items => body:', body);

    // ✅ soporta snake_case y camelCase
    const cartId = body.cart_id || body.cartId;
    const productId = body.product_id || body.productId;

    // vendor/supplier pueden o no venir (pero los soportamos igual)
    const vendorId = body.vendor_id || body.vendorId || null;
    const supplierId = body.supplier_id || body.supplierId || null;

    if (!cartId) return res.status(400).json({ error: 'cart_id es requerido' });
    if (!productId) return res.status(400).json({ error: 'product_id es requerido' });

    const quantity =
      body.quantity !== undefined && body.quantity !== null ? Number(body.quantity) : 1;

    const unitCost =
      body.unit_cost_price !== undefined && body.unit_cost_price !== null
        ? Number(body.unit_cost_price)
        : 0;

    const item = await prisma.cartItem.create({
      data: {
        cartId,
        productId,

        vendorId,
        supplierId,
        supplier_name: body.supplier_name || null,

        product_name: body.product_name || null,
        product_description: body.product_description || null,
        product_image_url: body.product_image_url || null,

        unit_of_measure: body.unit_of_measure || 'unit',
        quantity: Number.isNaN(quantity) ? 1 : quantity,
        unit_cost_price: Number.isNaN(unitCost) ? 0 : unitCost,

        margin_percent:
          body.margin_percent !== undefined && body.margin_percent !== null && body.margin_percent !== ''
            ? Number(body.margin_percent)
            : null,
      },
    });

    return res.status(201).json({ ...item, supplier_phone: item?.supplier?.phone || null });
  } catch (err) {
    console.error('Error POST /cart-items', err);
    return res.status(500).json({
      error: 'Error al crear item de carrito',
      detail: err.message,
    });
  }
});


app.patch("/cart-items/:id", async (req, res) => {
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
          : isNaN(Number(data.margin_percent))
          ? null
          : Number(data.margin_percent);
    }

    const item = await prisma.cartItem.update({
      where: { id },
      data: updateData,
    });

    res.json({ ...item, supplier_phone: item?.supplier?.phone || null });
  } catch (err) {
    console.error("Error PATCH /cart-items/:id", err);
    res.status(500).json({ error: "Error al actualizar item de carrito" });
  }
});

app.delete("/cart-items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cartItem.delete({ where: { id } });

    res.status(204).end();
  } catch (err) {
    console.error("Error DELETE /cart-items/:id", err);
    res.status(500).json({ error: "Error al eliminar item de carrito" });
  }
});

// ---------- QUOTES ----------

app.get("/quotes", async (req, res) => {
  try {
    const { vendor_id, id, page, limit } = req.query;
    const where = {};

    if (id) where.id = id;
    if (vendor_id) where.vendorId = vendor_id;

    // Paginación
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      data: quotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("Error GET /quotes", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Error al obtener presupuestos" });
  }
});

// Devuelve y RESERVA el próximo número (Q-000001, Q-000002, ...)
app.get("/quotes/next-number", async (req, res) => {
  try {
    const seq = await prisma.quoteNumberSeq.create({ data: {} });
    const quote_number = formatQuoteNumber(seq.id);

    res.json({ seqId: seq.id, quote_number });
  } catch (err) {
    console.error("Error GET /quotes/next-number", err);
    res.status(500).json({ error: "Error al generar número de presupuesto" });
  }
});



app.post("/quotes", async (req, res) => {
  try {
    const data = req.body;

    if (!data.vendor_id) return res.status(400).json({ error: "vendor_id es requerido" });
    if (!data.customer_name) return res.status(400).json({ error: "customer_name es requerido" });

    const quote = await prisma.$transaction(async (tx) => {
      let seqId = data.quote_seq_id;

      // ✅ si no vino reservado, generamos uno (fallback)
      if (!seqId) {
        const seq = await tx.quoteNumberSeq.create({ data: {} });
        seqId = seq.id;
      } else {
        // ✅ opcional pero recomendado: verificar que exista ese seqId
        const exists = await tx.quoteNumberSeq.findUnique({ where: { id: seqId } });
        if (!exists) throw new Error("quote_seq_id inválido o no reservado");
      }

      const quote_number = formatQuoteNumber(seqId);

      return await tx.quote.create({
        data: {
          vendorId: data.vendor_id,
          quote_number,
          customer_name: data.customer_name,
          customer_company: data.customer_company || null,
          customer_email: data.customer_email || null,
          customer_phone: data.customer_phone || null,
          status: data.status || "Draft",
          global_margin_percent: data.global_margin_percent ?? 20,
          notes: data.notes || null,
          total_cost: data.total_cost ?? 0,
          total_sale_price: data.total_sale_price ?? 0,
          total_profit_amount: data.total_profit_amount ?? 0,
        },
      });
    });

    res.status(201).json(quote);
  } catch (err) {
    console.error("Error POST /quotes", err);
    res.status(500).json({ error: "Error al crear presupuesto" });
  }
});



app.patch("/quotes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const data = {};

    if (body.customer_name !== undefined) data.customer_name = body.customer_name;
    if (body.customer_company !== undefined) data.customer_company = body.customer_company ?? null;
    if (body.customer_email !== undefined) data.customer_email = body.customer_email ?? null;
    if (body.customer_phone !== undefined) data.customer_phone = body.customer_phone ?? null;
    if (body.status !== undefined) data.status = body.status;
    if (body.global_margin_percent !== undefined)
      data.global_margin_percent = Number(body.global_margin_percent) || 0;
    if (body.notes !== undefined) data.notes = body.notes ?? null;
    if (body.total_cost !== undefined) data.total_cost = Number(body.total_cost) || 0;
    if (body.total_sale_price !== undefined) data.total_sale_price = Number(body.total_sale_price) || 0;
    if (body.total_profit_amount !== undefined) data.total_profit_amount = Number(body.total_profit_amount) || 0;
    if (body.vendor_id !== undefined) data.vendorId = body.vendor_id;

    const quote = await prisma.quote.update({
      where: { id },
      data,
    });

    res.json(quote);
  } catch (err) {
    console.error("Error PATCH /quotes/:id", err);
    res.status(500).json({ error: "Error al actualizar presupuesto" });
  }
});

app.delete("/quotes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Evita problemas de FK si no tenés cascade en Prisma
    await prisma.quoteLineItem.deleteMany({
      where: { quoteId: id },
    });

    await prisma.quote.delete({ where: { id } });

    res.status(204).end();
  } catch (err) {
    console.error("Error DELETE /quotes/:id", err);
    res.status(500).json({ error: "Error al eliminar presupuesto" });
  }
});

// ---------- QUOTE LINE ITEMS ----------

// GET /quote-line-items?quote_id=...&supplier_id=...&product_id=...&id=...
app.get("/quote-line-items", async (req, res) => {
  try {
    const { quote_id, supplier_id, product_id, id } = req.query;
    const where = {};

    if (id) where.id = id;
    if (quote_id) where.quoteId = quote_id;
    if (supplier_id) where.supplierId = supplier_id;
    if (product_id) where.productId = product_id;

    const items = await prisma.quoteLineItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(items);
  } catch (err) {
    console.error("Error GET /quote-line-items", err);
    res.status(500).json({ error: "Error al obtener items del presupuesto" });
  }
});

// POST /quote-line-items
app.post("/quote-line-items", async (req, res) => {
  try {
    const data = req.body;

    if (!data.quote_id) return res.status(400).json({ error: "quote_id es requerido" });
    if (!data.product_id) return res.status(400).json({ error: "product_id es requerido" });

    const qty = data.quantity !== undefined && data.quantity !== null ? Number(data.quantity) : 1;

    const item = await prisma.quoteLineItem.create({
      data: {
        quoteId: data.quote_id,
        supplierId: data.supplier_id || null,
        supplier_name: data.supplier_name || null,
        productId: data.product_id,
        product_name: data.product_name || null,
        product_description_snapshot: data.product_description_snapshot || null,
        unit_of_measure: data.unit_of_measure || null,

        quantity: Number.isNaN(qty) ? 1 : qty,
        unit_cost_price: Number(data.unit_cost_price) || 0,
        line_cost_total: Number(data.line_cost_total) || 0,

        margin_percent:
          data.margin_percent === null || data.margin_percent === undefined || data.margin_percent === ""
            ? null
            : (Number.isNaN(Number(data.margin_percent)) ? null : Number(data.margin_percent)),

        unit_sale_price: Number(data.unit_sale_price) || 0,
        line_sale_total: Number(data.line_sale_total) || 0,
        line_profit_amount: Number(data.line_profit_amount) || 0,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("Error POST /quote-line-items", err);
    res.status(500).json({ error: "Error al crear item del presupuesto" });
  }
});

// PATCH /quote-line-items/:id
app.patch("/quote-line-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const data = {};

    if (body.quote_id !== undefined) data.quoteId = body.quote_id;

    if (body.supplier_id !== undefined) data.supplierId = body.supplier_id;
    if (body.supplier_name !== undefined) data.supplier_name = body.supplier_name ?? null;

    if (body.product_id !== undefined) data.productId = body.product_id;
    if (body.product_name !== undefined) data.product_name = body.product_name ?? null;

    if (body.product_description_snapshot !== undefined)
      data.product_description_snapshot = body.product_description_snapshot ?? null;

    if (body.unit_of_measure !== undefined) data.unit_of_measure = body.unit_of_measure ?? null;

    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      data.quantity = Number.isNaN(q) ? 1 : q;
    }

    if (body.unit_cost_price !== undefined) data.unit_cost_price = Number(body.unit_cost_price) || 0;
    if (body.line_cost_total !== undefined) data.line_cost_total = Number(body.line_cost_total) || 0;

    if (body.margin_percent !== undefined) {
      data.margin_percent =
        body.margin_percent === null || body.margin_percent === ""
          ? null
          : (Number.isNaN(Number(body.margin_percent)) ? null : Number(body.margin_percent));
    }

    if (body.unit_sale_price !== undefined) data.unit_sale_price = Number(body.unit_sale_price) || 0;
    if (body.line_sale_total !== undefined) data.line_sale_total = Number(body.line_sale_total) || 0;
    if (body.line_profit_amount !== undefined) data.line_profit_amount = Number(body.line_profit_amount) || 0;

    const item = await prisma.quoteLineItem.update({
      where: { id },
      data,
    });

    res.json(item);
  } catch (err) {
    console.error("Error PATCH /quote-line-items/:id", err);
    res.status(500).json({ error: "Error al actualizar item del presupuesto" });
  }
});

// DELETE /quote-line-items/:id
app.delete("/quote-line-items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.quoteLineItem.delete({ where: { id } });

    res.status(204).end();
  } catch (err) {
    console.error("Error DELETE /quote-line-items/:id", err);
    res.status(500).json({ error: "Error al eliminar item del presupuesto" });
  }
});

// ---------- Centralized Error Handler ----------
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
  });

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ---------- Shutdown ordenado ----------

process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});
