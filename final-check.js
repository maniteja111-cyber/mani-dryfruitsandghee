const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('FINAL PRODUCT VERIFICATION');
  console.log('==================================================\n');
  
  const products = await prisma.product.findMany({
    include: {
      extension: { include: { masterUnit: true } },
      productVariants: { include: { variant: { include: { unit: true } } } }
    },
    orderBy: { name: 'asc' }
  });
  
  console.log(`Total Products: ${products.length}\n`);
  
  products.forEach(p => {
    const ext = p.extension;
    const unitType = ext?.masterUnit?.type || 'weight';
    
    let stockDisplay;
    if (unitType === 'weight') {
      stockDisplay = `${(p.stockGrams/1000).toFixed(0)} kg`;
    } else if (unitType === 'quantity') {
      stockDisplay = `${ext?.stockQuantity || 0} pieces`;
    } else if (unitType === 'pack') {
      stockDisplay = `${ext?.stockQuantity || 0} packs`;
    } else {
      stockDisplay = `${ext?.stockQuantity || 0} ${unitType}`;
    }
    
    const pricePerKg = ext?.basePrice || 0;
    const variants = p.productVariants.map(pv => pv.variant.label).join(', ');
    
    console.log(`${p.name}`);
    console.log(`  Category: ${p.category?.name}`);
    console.log(`  Type: ${unitType}`);
    console.log(`  Base Price: ₹${pricePerKg}`);
    console.log(`  Stock: ${stockDisplay}`);
    console.log(`  Variants: ${variants}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });