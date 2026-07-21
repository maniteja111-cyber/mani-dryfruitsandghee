const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('1. UNITS');
  console.log('==================================================');
  
  const units = await prisma.masterUnit.findMany();
  
  // Get products and their types
  const products = await prisma.product.findMany({
    select: {
      slug: true,
      extension: { select: { unitTypeId: true } }
    }
  });
  
  // Get pricing templates and their rules
  const templates = await prisma.pricingTemplate.findMany({
    include: { rules: true }
  });
  
  for (const unit of units) {
    const usedByProducts = products.filter(p => p.extension?.unitTypeId === unit.id).length;
    
    // Count variants using this unit
    const variantsCount = await prisma.masterVariant.count({
      where: { unitId: unit.id }
    });
    
    // Count pricing rules using variants from this unit
    let rulesCount = 0;
    for (const t of templates) {
      for (const r of (t.rules || [])) {
        const variant = await prisma.masterVariant.findUnique({ where: { id: r.variantId }, select: { unitId: true } });
        if (variant?.unitId === unit.id) rulesCount++;
      }
    }
    
    console.log(`ID: ${unit.id}`);
    console.log(`  Code: ${unit.code}`);
    console.log(`  Name: ${unit.name}`);
    console.log(`  Type: ${unit.type}`);
    console.log(`  Symbol: ${unit.symbol}`);
    console.log(`  Variants: ${variantsCount}`);
    console.log(`  Products: ${usedByProducts}`);
    console.log(`  Pricing Rules: ${rulesCount}`);
    console.log('---');
  }
  
  console.log('\n==================================================');
  console.log('2. VARIANTS (Grouped by Logical Meaning)');
  console.log('==================================================');
  
  // Get all variants with their units
  const variants = await prisma.masterVariant.findMany({
    include: { unit: true }
  });
  
  // Group by label
  const byLabel = {};
  variants.forEach(v => {
    if (!byLabel[v.label]) byLabel[v.label] = [];
    byLabel[v.label].push(v);
  });
  
  console.log('\n--- Weight Variants (grams) ---');
  const weightLabels = ['100g', '125g', '150g', '200g', '250g', '300g', '350g', '400g', '500g', '600g', '700g', '750g', '800g', '900g', '1kg', '1500g', '2000g', '3000g', '5000g'];
  weightLabels.forEach(label => {
    const vars = byLabel[label] || [];
    console.log(`\n${label}:`);
    vars.forEach(v => {
      console.log(`  ID: ${v.id}, Unit: ${v.unit.name}, Value: ${v.value}, Type: ${v.unit.type}`);
    });
    if (vars.length === 0) console.log('  (none)');
  });
  
  console.log('\n--- Quantity Variants ---');
  const qtyLabels = ['1 Piece', '2 Pieces', '3 Pieces', '4 Pieces', '5 Pieces', '6 Pieces', '7 Pieces', '8 Pieces', '9 Pieces', '10 Pieces', '12 Pieces', '15 Pieces', '20 Pieces', '25 Pieces', '30 Pieces', '50 Pieces', '100 Pieces'];
  qtyLabels.forEach(label => {
    const vars = byLabel[label] || [];
    console.log(`\n${label}:`);
    vars.forEach(v => {
      console.log(`  ID: ${v.id}, Unit: ${v.unit.name}, Value: ${v.value}, Type: ${v.unit.type}`);
    });
    if (vars.length === 0) console.log('  (none)');
  });
  
  console.log('\n--- Pack Variants ---');
  const packLabels = ['1 Pack', '3 Pack', '5 Pack', '10 Pack', '12 Pack', '15 Pack', '20 Pack', '25 Pack', '50 Pack'];
  packLabels.forEach(label => {
    const vars = byLabel[label] || [];
    console.log(`\n${label}:`);
    vars.forEach(v => {
      console.log(`  ID: ${v.id}, Unit: ${v.unit.name}, Value: ${v.value}, Type: ${v.unit.type}`);
    });
    if (vars.length === 0) console.log('  (none)');
  });
  
  console.log('\n--- Volume Variants ---');
  const volLabels = ['250ml', '500ml', '1L', '2L', '3L', '4L', '5L', '10L'];
  volLabels.forEach(label => {
    const vars = byLabel[label] || [];
    console.log(`\n${label}:`);
    vars.forEach(v => {
      console.log(`  ID: ${v.id}, Unit: ${v.unit.name}, Value: ${v.value}, Type: ${v.unit.type}`);
    });
    if (vars.length === 0) console.log('  (none)');
  });
  
  console.log('\n==================================================');
  console.log('3. PRICING TEMPLATES');
  console.log('==================================================');
  
  for (const template of templates) {
    console.log(`\nTemplate: ${template.name} (${template.slug})`);
    console.log(`  Rules: ${template.rules?.length || 0}`);
    console.log(`  Is Default: ${template.isDefault}`);
    console.log(`  Active: ${template.isActive}`);
    
    // Check for missing variants
    const allVariantIds = (await prisma.masterVariant.findMany({ select: { id: true } })).map(v => v.id);
    const ruleVariantIds = template.rules?.map(r => r.variantId) || [];
    const missingVariants = allVariantIds.filter(id => !ruleVariantIds.includes(id));
    console.log(`  Missing Variants: ${missingVariants.length}`);
    
    // Check for duplicate rules
    const uniqueVariantIds = new Set(ruleVariantIds);
    console.log(`  Duplicate Rules: ${ruleVariantIds.length - uniqueVariantIds.size}`);
    
    // Check for invalid percentages
    const invalidPct = template.rules?.filter(r => r.percentage <= 0 || r.percentage > 100000) || [];
    console.log(`  Invalid Percentages: ${invalidPct.length}`);
  }
  
  console.log('\n==================================================');
  console.log('4. PRODUCTS BY TYPE');
  console.log('==================================================');
  
  const productsWithType = await prisma.product.findMany({
    include: { extension: { select: { unitTypeId: true } } }
  });
  
  const typeCounts = { weight: 0, quantity: 0, pack: 0, volume: 0 };
  for (const p of productsWithType) {
    const unitType = (await prisma.masterUnit.findUnique({ 
      where: { id: p.extension?.unitTypeId },
      select: { type: true }
    }))?.type;
    if (unitType && typeCounts.hasOwnProperty(unitType)) {
      typeCounts[unitType]++;
    }
  }
  
  console.log('Weight:', typeCounts.weight);
  console.log('Pack:', typeCounts.pack);
  console.log('Piece:', typeCounts.quantity);
  console.log('Volume:', typeCounts.volume);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });