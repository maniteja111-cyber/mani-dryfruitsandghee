const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('FIXING STOCK LEVELS');
  console.log('==================================================\n');
  
  // Update stock for each product
  const stockUpdates = [
    { slug: 'premium-almonds', stockGrams: 50000 },  // 50kg
    { slug: 'cashew-pieces', stockQuantity: 1000 },  // 1000 pieces
    { slug: 'almond-pack', stockQuantity: 3000 },     // 3000 packs
    { slug: 'coconut-oil-1l', stockLitres: 50 },     // 50 litres
    { slug: 'pure-ghee-1l', stockLitres: 20 },       // 20 litres
    { slug: 'walnut-medley', stockGrams: 25000 },    // 25kg
    { slug: 'raisins-pack', stockQuantity: 40000 },  // 40000 packs
    { slug: 'butter-chicken', stockQuantity: 1500 }, // 1500 pieces
    { slug: 'mango-pickle', stockQuantity: 10000 }   // 10000 pieces
  ];
  
  for (const update of stockUpdates) {
    const product = await prisma.product.findUnique({ where: { slug: update.slug } });
    if (!product) continue;
    
    // First ensure extension exists
    let extension = await prisma.productExtension.findUnique({ where: { productId: product.id } });
    
    if (!extension) {
      extension = await prisma.productExtension.create({
        data: {
          productId: product.id,
          basePrice: product.pricePerKg || 0
        }
      });
    }
    
    if (update.stockGrams !== undefined) {
      await prisma.product.update({
        where: { id: product.id },
        data: { stockGrams: update.stockGrams }
      });
      console.log(`Updated ${update.slug}: stockGrams = ${update.stockGrams}`);
    }
    
    if (update.stockLitres !== undefined) {
      await prisma.product.update({
        where: { id: product.id },
        data: { stockGrams: update.stockLitres * 1000 }
      });
      console.log(`Updated ${update.slug}: stockGrams = ${update.stockLitres * 1000} (from ${update.stockLitres}L)`);
    }
    
    if (update.stockQuantity !== undefined) {
      await prisma.productExtension.update({
        where: { productId: product.id },
        data: { stockQuantity: update.stockQuantity }
      });
      console.log(`Updated ${update.slug}: stockQuantity = ${update.stockQuantity}`);
    }
  }
  
  // Verify
  console.log('\n\nFinal Stock Levels:');
  console.log('==================');
  const products = await prisma.product.findMany({
    include: { extension: true }
  });
  
  products.forEach(p => {
    const ext = p.extension;
    const stockDisplay = ext?.stockQuantity ? `${ext.stockQuantity} ${ext.masterUnit?.type === 'weight' ? 'pieces' : ext.masterUnit?.type === 'pack' ? 'packs' : 'pieces'}` : 
                         (p.stockGrams ? `${(p.stockGrams/1000).toFixed(0)} kg` : '0');
    console.log(`${p.name}: ${stockDisplay}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });