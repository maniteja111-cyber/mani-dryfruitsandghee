const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('CHECKING CATEGORIES');
  console.log('==================================================\n');
  
  const categories = await prisma.category.findMany();
  console.log('Categories:');
  categories.forEach(c => console.log(`  ${c.name} (${c.slug})`));
  
  // Check products with categories
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  
  console.log('\n\nProducts with categories:');
  products.forEach(p => {
    console.log(`  ${p.name}: ${p.category?.name || 'NO CATEGORY'}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });