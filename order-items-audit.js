const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('ORDER ITEMS AUDIT');
  console.log('==================================================\n');
  
  const orderItems = await prisma.orderItem.findMany();
  
  console.log('Order items:', orderItems.length);
  orderItems.forEach(oi => {
    console.log(`Item ${oi.id}:`);
    console.log(`  Order ID: ${oi.orderId}`);
    console.log(`  Product ID: ${oi.productId}`);
    console.log(`  Quantity: ${oi.quantity}`);
    console.log(`  Price: ${oi.price}`);
    console.log(`  Variant: ${oi.variant}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });