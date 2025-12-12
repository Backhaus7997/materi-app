/*
  Warnings:

  - Added the required column `vendorId` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("createdAt", "customer_company", "customer_email", "customer_name", "customer_phone", "global_margin_percent", "id", "notes", "quote_number", "status", "total_cost", "total_profit_amount", "total_sale_price", "updatedAt") SELECT "createdAt", "customer_company", "customer_email", "customer_name", "customer_phone", "global_margin_percent", "id", "notes", "quote_number", "status", "total_cost", "total_profit_amount", "total_sale_price", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
