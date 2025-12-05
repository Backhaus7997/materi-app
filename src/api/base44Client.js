// src/api/base44Client.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------- SUPPLIERS (backend real) ----------

const SupplierEntity = {
  async filter(query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return request(`/suppliers${qs ? `?${qs}` : ""}`);
  },

  async get(id) {
    return request(`/suppliers/${id}`);
  },

  async create(data) {
    return request(`/suppliers`, {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return request(`/suppliers/${id}`, {
      method: "PATCH",
      body: data,
    });
  },

  async delete(id) {
    return request(`/suppliers/${id}`, {
      method: "DELETE",
    });
  },
};

// ---------- PRODUCTS (backend real) ----------

const ProductEntity = {
  async filter(query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },

  async get(id) {
    return request(`/products/${id}`);
  },

  async create(data) {
    return request(`/products`, {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return request(`/products/${id}`, {
      method: "PATCH",
      body: data,
    });
  },

  async delete(id) {
    return request(`/products/${id}`, {
      method: "DELETE",
    });
  },
};

// ---------- CARTS (backend real) ----------

const CartEntity = {
  async filter(query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return request(`/carts${qs ? `?${qs}` : ""}`);
  },

  async get(id) {
    return request(`/carts?id=${encodeURIComponent(id)}`);
  },

  async create(data) {
    return request(`/carts`, {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return request(`/carts/${id}`, {
      method: "PATCH",
      body: data,
    });
  },
};

// ---------- CART ITEMS (backend real) ----------

const CartItemEntity = {
  async filter(query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return request(`/cart-items${qs ? `?${qs}` : ""}`);
  },

  async get(id) {
    return request(`/cart-items/${id}`);
  },

  async create(data) {
    return request(`/cart-items`, {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return request(`/cart-items/${id}`, {
      method: "PATCH",
      body: data,
    });
  },

  async delete(id) {
    return request(`/cart-items/${id}`, {
      method: "DELETE",
    });
  },
};

// ---------- Mocks para lo que todavía no migramos ----------

let idCounter = 1;
const genId = () => String(idCounter++);

function createMockEntity(name) {
  let items = [];

  return {
    async filter() {
      console.log(`[MOCK ${name}] filter()`);
      return items;
    },
    async get(id) {
      console.log(`[MOCK ${name}] get(${id})`);
      return items.find((i) => i.id === id) || null;
    },
    async create(data) {
      console.log(`[MOCK ${name}] create()`, data);
      const item = { id: genId(), ...data };
      items.push(item);
      return item;
    },
    async update(id, data) {
      console.log(`[MOCK ${name}] update(${id})`, data);
      items = items.map((i) => (i.id === id ? { ...i, ...data } : i));
      return items.find((i) => i.id === id) || null;
    },
    async delete(id) {
      console.log(`[MOCK ${name}] delete(${id})`);
      items = items.filter((i) => i.id !== id);
    },
  };
}

// ---------- EXPORT base44 compatible con el código existente ----------

export const base44 = {
  entities: {
    Supplier: SupplierEntity,
    Product: ProductEntity,

    Cart: CartEntity,
    CartItem: CartItemEntity,

    // Todavía mock: los vamos a migrar después
    Quote: createMockEntity("Quote"),
    QuoteLineItem: createMockEntity("QuoteLineItem"),
  },

  auth: {
    async me() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) {
          return null;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Error HTTP ${res.status}`);
        }

        return res.json();
      } catch (err) {
        console.error("[auth.me] error", err);
        return null;
      }
    },

    async updateMe(data) {
      return request("/auth/me", {
        method: "PATCH",
        body: data,
      });
    },

    async login({ email, password }) {
      return request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
    },

    async register({ name, email, password, user_role }) {
      return request("/auth/register", {
        method: "POST",
        body: { name, email, password, user_role },
      });
    },

    async logout() {
      return request("/auth/logout", {
        method: "POST",
      });
    },
  },
};
