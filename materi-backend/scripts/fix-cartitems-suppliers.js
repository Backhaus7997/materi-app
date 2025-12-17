import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isBlank(v) {
  return v == null || (typeof v === "string" && v.trim() === "");
}

async function main() {
  // 1) CartItems rotos: sin supplierId (pero pueden tener supplier_name)
  const broken = await prisma.cartItem.findMany({
    where: {
      OR: [{ supplierId: null }, { supplierId: "" }],
    },
    select: {
      id: true,
      cartId: true,
      productId: true,
      supplierId: true,
      supplier_name: true,
    },
  });

  console.log(`Encontrados ${broken.length} cart_items sin supplierId`);
  if (broken.length === 0) return;

  // 2) Precargar products + suppliers
  const productIds = [...new Set(broken.map((i) => i.productId).filter(Boolean))];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      supplierId: true,        // si tu Product usa supplier_id en vez de supplierId, te va a avisar
      supplier_name: true,     // si tu Product usa supplierName, te va a avisar
      supplier_name: true,
    },
  });

  const suppliers = await prisma.supplier.findMany({
    select: {
      id: true,
      name: true,
      company_name: true, // si en tu schema es companyName, Prisma lo va a avisar
    },
  });

  const productById = new Map(products.map((p) => [p.id, p]));

  const suppliersByName = new Map();
  for (const s of suppliers) {
    if (s.name) suppliersByName.set(s.name.trim().toLowerCase(), s);
    if (s.company_name) suppliersByName.set(s.company_name.trim().toLowerCase(), s);
  }

  let fixed = 0;
  let skipped = 0;

  for (const item of broken) {
    let supplierId = null;
    let supplierName = null;

    // A) Resolver por productId
    const p = item.productId ? productById.get(item.productId) : null;
    if (p) {
      supplierId = p.supplierId ?? null;
      supplierName = p.supplier_name ?? null;
    }

    // B) Fallback por supplier_name del item
    if (isBlank(supplierId) && !isBlank(item.supplier_name)) {
      const key = item.supplier_name.trim().toLowerCase();
      const s = suppliersByName.get(key);
      if (s) {
        supplierId = s.id;
        supplierName = s.name ?? s.company_name ?? item.supplier_name;
      }
    }

    if (isBlank(supplierId)) {
      skipped++;
      continue;
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: {
        supplierId,
        supplier_name: supplierName ?? item.supplier_name ?? "",
      },
    });

    fixed++;
  }

  console.log(`Fix OK: ${fixed}`);
  console.log(`Saltados (no se pudo resolver): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
