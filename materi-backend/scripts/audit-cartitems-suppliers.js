import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.cartItem.findMany({
    select: { id: true, cartId: true, supplierId: true, supplier_name: true },
  });

  const supplierIds = [...new Set(items.map(i => i.supplierId).filter(Boolean))];

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, name: true, company_name: true, phone: true },
  });

  const supById = new Map(suppliers.map(s => [s.id, s]));

  const missingSupplier = [];
  const missingPhone = [];

  for (const i of items) {
    if (!i.supplierId) continue;

    const s = supById.get(i.supplierId);
    if (!s) {
      missingSupplier.push(i);
      continue;
    }
    if (!s.phone || String(s.phone).trim() === "") {
      missingPhone.push({ item: i, supplier: s });
    }
  }

  console.log("Total cart_items:", items.length);
  console.log("Con supplierId:", items.filter(i => i.supplierId).length);
  console.log("supplierId que no existe en Supplier:", missingSupplier.length);
  console.log("Supplier sin phone:", missingPhone.length);

  if (missingSupplier.length) {
    console.log("\n--- Ejemplos missingSupplier (max 10) ---");
    console.log(missingSupplier.slice(0, 10));
  }

  if (missingPhone.length) {
    console.log("\n--- Ejemplos missingPhone (max 10) ---");
    console.log(missingPhone.slice(0, 10));
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
