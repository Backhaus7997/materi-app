-- CreateIndex
CREATE INDEX "Cart_vendorId_idx" ON "Cart"("vendorId");

-- CreateIndex
CREATE INDEX "CartItem_vendorId_idx" ON "CartItem"("vendorId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE INDEX "CartItem_supplierId_idx" ON "CartItem"("supplierId");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Quote_vendorId_idx" ON "Quote"("vendorId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_createdAt_idx" ON "Quote"("createdAt");

-- CreateIndex
CREATE INDEX "QuoteLineItem_quoteId_idx" ON "QuoteLineItem"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteLineItem_productId_idx" ON "QuoteLineItem"("productId");

-- CreateIndex
CREATE INDEX "QuoteLineItem_supplierId_idx" ON "QuoteLineItem"("supplierId");

-- CreateIndex
CREATE INDEX "Supplier_active_idx" ON "Supplier"("active");

-- CreateIndex
CREATE INDEX "User_user_role_idx" ON "User"("user_role");

-- CreateIndex
CREATE INDEX "User_supplierId_idx" ON "User"("supplierId");
