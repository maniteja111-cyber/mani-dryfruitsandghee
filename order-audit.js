const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('ORDER DATA AUDIT');
  console.log('==================================================\n');
  
  const orders = await prisma.order.findMany({
    include: { orderItems: true }
  });
  
  console.log('Orders:', orders.length);
  orders.forEach(o => {
    console.log(`\nOrder ${o.id}:`);
    console.log(`  Status: ${o.status}`);
    console.log(`  Total: ${o.total}`);
    o.orderItems.forEach(oi => {
      console.log(`  Item: ${oi.productId}, qty: ${oi.quantity}, price: ${oi.price}`);
      console.log(`    Variant data: ${oi.variant}`);
    });
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });