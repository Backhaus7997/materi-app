-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplier_name" TEXT,
    "productId" TEXT NOT NULL,
    "product_name" TEXT,
    "product_description_snapshot" TEXT,
    "unit_of_measure" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit_cost_price" REAL NOT NULL,
    "line_cost_total" REAL DEFAULT 0,
    "margin_percent" REAL,
    "unit_sale_price" REAL,
    "line_sale_total" REAL DEFAULT 0,
    "line_profit_amount" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
