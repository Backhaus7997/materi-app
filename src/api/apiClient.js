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

function buildQS(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ---------- SUPPLIERS ----------

const SupplierEntity = {
  async filter(query = {}) {
    const response = await request(`/suppliers${buildQS(query)}`);
    return response.data || response;
  },
  async list() {
    const response = await request(`/suppliers`);
    return response.data || response;
  },
  async get(id) {
    return request(`/suppliers?id=${encodeURIComponent(id)}`);
  },
  async create(data) {
    return request(`/suppliers`, { method: "POST", body: data });
  },
  async update(id, data) {
    return request(`/suppliers/${id}`, { method: "PATCH", body: data });
  },
  async delete(id) {
    return request(`/suppliers/${id}`, { method: "DELETE" });
  },
};

// ---------- PRODUCTS ----------

const ProductEntity = {
  async filter(query = {}) {
    const response = await request(`/products${buildQS(query)}`);
    return response.data || response;
  },
  async list() {
    const response = await request(`/products`);
    return response.data || response;
  },
  async get(id) {
    return request(`/products/${id}`);
  },
  async create(data) {
    return request(`/products`, { method: "POST", body: data });
  },
  async update(id, data) {
    return request(`/products/${id}`, { method: "PATCH", body: data });
  },
  async delete(id) {
    return request(`/products/${id}`, { method: "DELETE" });
  },
};

// ---------- CARTS ----------

const CartEntity = {
  async filter(query = {}) {
    return request(`/carts${buildQS(query)}`);
  },
  async get(id) {
    return request(`/carts?id=${encodeURIComponent(id)}`);
  },
  async create(data) {
    return request(`/carts`, { method: "POST", body: data });
  },
  async update(id, data) {
    return request(`/carts/${id}`, { method: "PATCH", body: data });
  },
};

// ---------- CART ITEMS ----------

const CartItemEntity = {
  async filter(query = {}) {
    return request(`/cart-items${buildQS(query)}`);
  },
  async get(id) {
    return request(`/cart-items/${id}`);
  },
  async create(data) {
    return request(`/cart-items`, { method: "POST", body: data });
  },
  async update(id, data) {
    return request(`/cart-items/${id}`, { method: "PATCH", body: data });
  },
  async delete(id) {
    return request(`/cart-items/${id}`, { method: "DELETE" });
  },
};

// ---------- QUOTES ----------

const QuoteEntity = {
  async filter(query = {}) {
    const response = await request(`/quotes${buildQS(query)}`);
    return response.data || response;
  },
  async get(id) {
    return request(`/quotes?id=${encodeURIComponent(id)}`);
  },
  async create(data) {
    return request(`/quotes`, { method: "POST", body: data });
  },
  async update(id, data) {
    return request(`/quotes/${id}`, { method: "PATCH", body: data });
  },
  async delete(id) {
    return request(`/quotes/${id}`, { method: "DELETE" });
  },

  // ✅ nuevo: pide el próximo número
  async nextNumber() {
    return request(`/quotes/next-number`);
  },
};


// ---------- QUOTE LINE ITEMS ----------

const QuoteLineItemEntity = {
  async filter(query = {}) {
    return request(`/quote-line-items${buildQS(query)}`);
  },
  async get(id) {
    return request(`/quote-line-items/${id}`);
  },
  async create(data) {
    return request(`/quote-line-items`, { method: "POST", body: data });
  },
  async update(id, data) {
    return request(`/quote-line-items/${id}`, { method: "PATCH", body: data });
  },
  async delete(id) {
    return request(`/quote-line-items/${id}`, { method: "DELETE" });
  },
};

// ---------- EXPORT ----------

export const api = {
  entities: {
    Supplier: SupplierEntity,
    Product: ProductEntity,
    Cart: CartEntity,
    CartItem: CartItemEntity,
    Quote: QuoteEntity,
    QuoteLineItem: QuoteLineItemEntity,
  },

  auth: {
    async me() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) return null;

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
      return request("/auth/me", { method: "PATCH", body: data });
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
      return request("/auth/logout", { method: "POST" });
    },
  },
};
