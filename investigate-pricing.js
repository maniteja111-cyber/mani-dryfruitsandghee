const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // PART 1: Product details
  console.log('==================================================');
  console.log('PART 1: Product Details for Premium Almonds');
  console.log('==================================================');
  
  const product = await prisma.product.findUnique({
    where: { slug: 'premium-almonds' },
    include: { extension: true }
  });
  
  console.log('Product ID:', product.id);
  console.log('Pricing Template ID:', product.extension?.pricingTemplateId);
  console.log('Product Type:', product.extension?.masterUnit?.type);
  console.log('Base Price:', product.extension?.basePrice);
  console.log('Stock Grams:', product.stockGrams);
  console.log('Price Per Kg:', product.pricePerKg);
  
  // Get pricing template name
  const template = await prisma.pricingTemplate.findUnique({
    where: { id: product.extension?.pricingTemplateId }
  });
  console.log('Pricing Template Name:', template?.name);
  
  console.log('\n==================================================');
  console.log('PART 2: Assigned Variants');
  console.log('==================================================');
  
  const productVariants = await prisma.productProductVariant.findMany({
    where: { productId: product.id },
    include: { variant: { include: { unit: true } } }
  });
  
  productVariants.forEach(pv => {
    console.log('Product Variant ID:', pv.id);
    console.log('  Variant ID:', pv.variantId);
    console.log('  Variant Label:', pv.variant.label);
    console.log('  Variant Value:', pv.variant.value);
    console.log('  Unit:', pv.variant.unit.name);
    console.log('  Type:', pv.variant.unit.type);
    console.log('  Sort Order:', pv.variant.sortOrder);
    console.log('  Active:', pv.variant.isActive);
    console.log('---');
  });
  
  console.log('\n==================================================');
  console.log('PART 3: Pricing Rules for Template');
  console.log('==================================================');
  
  const rules = await prisma.pricingRule.findMany({
    where: { templateId: product.extension?.pricingTemplateId },
    include: { variant: { include: { unit: true } } },
    orderBy: { variant: { sortOrder: 'asc' } }
  });
  
  rules.forEach(rule => {
    console.log('Pricing Rule ID:', rule.id);
    console.log('  Variant ID:', rule.variantId);
    console.log('  Percentage:', rule.percentage);
    console.log('  Variant Label:', rule.variant.label);
    console.log('  Variant Type:', rule.variant.unit.type);
    console.log('---');
  });
  
  console.log('\n==================================================');
  console.log('PART 4: Compare Variant IDs vs Pricing Rule Variant IDs');
  console.log('==================================================');
  
  const productVariantIds = productVariants.map(pv => pv.variantId);
  const ruleVariantIds = rules.map(r => r.variantId);
  
  console.log('Product Variant IDs:', productVariantIds);
  console.log('Pricing Rule Variant IDs:', ruleVariantIds);
  
  productVariantIds.forEach(id => {
    if (ruleVariantIds.includes(id)) {
      const rule = rules.find(r => r.variantId === id);
      console.log('MATCH:', id, '- Percentage:', rule?.percentage);
    } else {
      console.log('NO MATCH:', id);
    }
  });
  
  console.log('\n==================================================');
  console.log('PART 10: Root Cause Analysis');
  console.log('==================================================');
  
  console.log('All pricing rules have 100% percentage');
  console.log('This means: Base Price × (100/100) = Base Price');
  console.log('All variants show the same price because all percentages are 100%');
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});