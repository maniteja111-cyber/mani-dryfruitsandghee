const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('VERIFICATION - IMPORTED PRODUCTS');
  console.log('==================================================\n');
  
  const products = await prisma.product.findMany({
    include: {
      extension: true,
      productVariants: { include: { variant: { include: { unit: true } } } }
    }
  });
  
  console.log(`Total products: ${products.length}\n`);
  
  products.forEach(p => {
    console.log(`${p.name} (${p.slug})`);
    console.log(`  Base Price: ₹${p.extension?.basePrice}`);
    console.log(`  Product Type: ${p.extension?.masterUnit?.type}`);
    console.log(`  Variants:`);
    p.productVariants.forEach(pv => {
      console.log(`    - ${pv.variant.label} (ID: ${pv.variantId})`);
    });
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });