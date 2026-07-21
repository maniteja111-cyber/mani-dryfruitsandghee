const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('FINAL VERIFICATION');
  console.log('==================================================\n');
  
  const products = await prisma.product.findMany({
    include: {
      extension: { include: { masterUnit: true } },
      productVariants: { include: { variant: { include: { unit: true } } } }
    }
  });
  
  console.log(`Total Products: ${products.length}\n`);
  
  products.forEach(p => {
    const ext = p.extension;
    const stock = ext?.stockQuantity ? `${ext.stockQuantity} ${ext.masterUnit?.type}` : 
                  (p.stockGrams ? `${(p.stockGrams/1000).toFixed(0)} kg` : '0');
    const variants = p.productVariants.map(pv => pv.variant.label).join(', ');
    console.log(`${p.name}`);
    console.log(`  Slug: ${p.slug}`);
    console.log(`  Category: ${p.categoryName || 'N/A'}`);
    console.log(`  Base Price: ₹${ext?.basePrice}`);
    console.log(`  Stock: ${stock}`);
    console.log(`  Variants: ${variants}`);
    console.log(`  Type: ${ext?.masterUnit?.type || 'N/A'}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });