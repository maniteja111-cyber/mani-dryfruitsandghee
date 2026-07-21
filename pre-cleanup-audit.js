const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('PRE-CLEANUP AUDIT REPORT');
  console.log('==================================================\n');
  
  // 1. Check for remaining product references
  console.log('1. PRODUCT REFERENCES');
  console.log('----------------------');
  const productCount = await prisma.product.count();
  console.log('Products in database:', productCount);
  
  const productVariantCount = await prisma.productProductVariant.count();
  console.log('ProductVariant records:', productVariantCount);
  
  // 2. Check for order references
  console.log('\n2. ORDER REFERENCES');
  console.log('-------------------');
  const orderCount = await prisma.order.count();
  console.log('Orders in database:', orderCount);
  
  // 3. Check unit usage
  console.log('\n3. UNIT USAGE');
  console.log('-------------');
  const units = await prisma.masterUnit.findMany();
  for (const unit of units) {
    const variantCount = await prisma.masterVariant.count({ where: { unitId: unit.id } });
    console.log(`${unit.code} (${unit.id}): ${variantCount} variants`);
  }
  
  // 4. Check pricing template usage
  console.log('\n4. PRICING TEMPLATE USAGE');
  console.log('-------------------------');
  const templates = await prisma.pricingTemplate.findMany({
    include: { _count: { select: { products: true, rules: true } } }
  });
  templates.forEach(t => {
    console.log(`${t.name}: ${t._count.products} products, ${t._count.rules} rules`);
  });
  
  // 5. Check variant usage in pricing rules
  console.log('\n5. VARIANT USAGE IN PRICING RULES');
  console.log('-----------------------------------');
  const allVariants = await prisma.masterVariant.findMany({ include: { unit: true } });
  const allRules = await prisma.pricingRule.findMany();
  const ruleVariantIds = new Set(allRules.map(r => r.variantId));
  
  let usedVariants = 0;
  let unusedVariants = 0;
  
  allVariants.forEach(v => {
    if (ruleVariantIds.has(v.id)) {
      usedVariants++;
    } else {
      unusedVariants++;
    }
  });
  
  console.log('Variants used in pricing rules:', usedVariants);
  console.log('Unused variants:', unusedVariants);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });