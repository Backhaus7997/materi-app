-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quote_number" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_company" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "global_margin_percent" REAL NOT NULL DEFAULT 20,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "total_sale_price" REAL NOT NULL DEFAULT 0,
    "total_profit_amount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
