const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('STEP 1: Product Details for Premium Almonds');
  console.log('==================================================');
  
  const product = await prisma.product.findUnique({
    where: { slug: 'premium-almonds' },
    include: { 
      extension: true,
      productVariants: { 
        include: { 
          variant: { 
            include: { unit: true } 
          } 
        } 
      }
    }
  });
  
  console.log('Product ID:', product.id);
  console.log('Pricing Template ID:', product.extension?.pricingTemplateId);
  console.log('Base Price:', product.extension?.basePrice);
  
  console.log('\nAssigned ProductVariants:');
  product.productVariants.forEach(pv => {
    console.log('  ProductVariant ID:', pv.id);
    console.log('  Variant ID:', pv.variantId);
    console.log('  Variant Label:', pv.variant.label);
    console.log('  Variant Value:', pv.variant.value);
    console.log('  Variant Type:', pv.variant.unit.type);
    console.log('---');
  });
  
  console.log('\n==================================================');
  console.log('STEP 2: Pricing Rules for Linear Pricing Template');
  console.log('==================================================');
  
  const templateId = product.extension?.pricingTemplateId;
  const rules = await prisma.pricingRule.findMany({
    where: { templateId },
    include: { variant: { include: { unit: true } } }
  });
  
  rules.forEach(rule => {
    console.log('PricingRule ID:', rule.id);
    console.log('  Variant ID:', rule.variantId);
    console.log('  Variant Label:', rule.variant.label);
    console.log('  Variant Value:', rule.variant.value);
    console.log('  Variant Type:', rule.variant.unit.type);
    console.log('  Percentage:', rule.percentage);
    console.log('---');
  });
  
  console.log('\n==================================================');
  console.log('STEP 3: Match Product Variants with Pricing Rules');
  console.log('==================================================');
  
  const productVariantIds = product.productVariants.map(pv => pv.variantId);
  const ruleVariantIds = rules.map(r => r.variantId);
  
  productVariantIds.forEach(id => {
    const match = rules.find(r => r.variantId === id);
    if (match) {
      console.log('MATCH:', id);
      console.log('  Percentage:', match.percentage);
    } else {
      console.log('NO MATCH:', id);
    }
  });
  
  console.log('\n==================================================');
  console.log('STEP 4: Find Duplicates for NO MATCH Variants');
  console.log('==================================================');
  
  for (const pvId of productVariantIds) {
    if (!ruleVariantIds.includes(pvId)) {
      const pv = product.productVariants.find(p => p.variantId === pvId);
      console.log('Product Variant:', pv.variant.label, pv.variant.value, pv.variant.unit.type);
      
      const duplicates = await prisma.masterVariant.findMany({
        where: {
          label: pv.variant.label,
          value: pv.variant.value,
          unit: { type: pv.variant.unit.type }
        },
        include: { unit: true }
      });
      
      duplicates.forEach(dup => {
        console.log('  Duplicate ID:', dup.id, '- Used by pricing rules?', ruleVariantIds.includes(dup.id));
      });
      console.log('---');
    }
  }
  
  console.log('\n==================================================');
  console.log('STEP 5: Count Duplicate Variants');
  console.log('==================================================');
  
  const allVariants = await prisma.masterVariant.findMany({
    include: { unit: true }
  });
  
  const grouped = {};
  allVariants.forEach(v => {
    const key = v.label + '|' + v.value + '|' + v.unit.type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  });
  
  let totalDuplicates = 0;
  Object.entries(grouped).forEach(([key, variants]) => {
    if (variants.length > 1) {
      console.log('Duplicate:', key);
      console.log('  IDs:', variants.map(v => v.id).join(', '));
      totalDuplicates++;
    }
  });
  console.log('Total duplicate groups:', totalDuplicates);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });