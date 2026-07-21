const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('FIXING STOCK AND VARIANTS');
  console.log('==================================================\n');
  
  // First, let's check what variants exist
  const variants = await prisma.masterVariant.findMany({
    include: { unit: true }
  });
  
  console.log('Available Variants:');
  variants.forEach(v => console.log(`  ${v.label} (${v.unit.type})`));
  
  // Now check products
  const products = await prisma.product.findMany({
    include: {
      extension: true,
      productVariants: { include: { variant: { include: { unit: true } } } }
    }
  });
  
  console.log('\n\nCurrent Product State:');
  products.forEach(p => {
    console.log(`\n${p.name}:`);
    console.log(`  Stock (grams): ${p.stockGrams}`);
    console.log(`  Stock (qty): ${p.extension?.stockQuantity}`);
    console.log(`  Unit Type: ${p.extension?.masterUnit?.type}`);
    console.log(`  Variants: ${p.productVariants.map(pv => pv.variant.label).join(', ')}`);
  });
  
  // Fix stock for quantity/pack products
  const stockFixes = [
    { slug: 'cashew-pieces', stockQuantity: 1000 },
    { slug: 'almond-pack', stockQuantity: 3000 },
    { slug: 'raisins-pack', stockQuantity: 40000 },
    { slug: 'butter-chicken', stockQuantity: 1500 },
    { slug: 'mango-pickle', stockQuantity: 10000 }
  ];
  
  console.log('\n\nFixing stock...');
  for (const fix of stockFixes) {
    const product = await prisma.product.findUnique({ where: { slug: fix.slug } });
    if (product) {
      await prisma.productExtension.update({
        where: { productId: product.id },
        data: { stockQuantity: fix.stockQuantity }
      });
      console.log(`Fixed ${fix.slug}: stockQuantity = ${fix.stockQuantity}`);
    }
  }
  
  // Verify
  console.log('\n\nFinal Stock Levels:');
  const updatedProducts = await prisma.product.findMany({
    include: { extension: { include: { masterUnit: true } } }
  });
  
  updatedProducts.forEach(p => {
    const ext = p.extension;
    const stock = ext?.stockQuantity ? `${ext.stockQuantity} ${ext.masterUnit?.type || 'pieces'}` : 
                  (p.stockGrams ? `${(p.stockGrams/1000).toFixed(0)} kg` : '0');
    console.log(`${p.name}: ${stock}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });