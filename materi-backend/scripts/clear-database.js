// Script para limpiar toda la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Iniciando limpieza de base de datos...');

    // Eliminar en orden correcto para respetar foreign keys
    console.log('Eliminando QuoteLineItems...');
    await prisma.quoteLineItem.deleteMany({});

    console.log('Eliminando Quotes...');
    await prisma.quote.deleteMany({});

    console.log('Eliminando QuoteNumberSeq...');
    await prisma.quoteNumberSeq.deleteMany({});

    console.log('Eliminando CartItems...');
    await prisma.cartItem.deleteMany({});

    console.log('Eliminando Carts...');
    await prisma.cart.deleteMany({});

    console.log('Eliminando Products...');
    await prisma.product.deleteMany({});

    console.log('Eliminando Suppliers...');
    await prisma.supplier.deleteMany({});

    console.log('Eliminando Users...');
    await prisma.user.deleteMany({});

    console.log('✅ Base de datos limpiada exitosamente!');
    console.log('Ahora puedes registrar nuevas cuentas desde cero.');

  } catch (error) {
    console.error('❌ Error al limpiar base de datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
