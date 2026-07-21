const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('MASTER DATA CLEANUP - PHASE 2');
  console.log('==================================================\n');
  
  // ==================================================
  // STEP 1: NORMALIZE UNITS
  // ==================================================
  console.log('STEP 1: NORMALIZING UNITS');
  console.log('===========================\n');
  
  // Define canonical units (keep these)
  const canonicalUnits = {
    weight: 'cmrcbrsfm000113xw9gsnrogd',  // kg
    quantity: 'cmrrii4k50001wg8ns1826y4p', // PC
    pack: 'cmrrii4pv0002wg8nqbo0yx5k', // PK
    volume: 'cmrrii4xb0003wg8nyib8zbp5'  // L
  };
  
  // Get all units
  const allUnits = await prisma.masterUnit.findMany();
  
  // Find units to delete (duplicates)
  const unitsToDelete = allUnits.filter(u => 
    u.code === 'g' || 
    u.code === 'piece' || 
    u.code === 'liter' || 
    u.code === 'pack' ||
    u.code === 'PC' ||
    u.code === 'PK' ||
    u.code === 'L'
  ).filter(u => Object.values(canonicalUnits).includes(u.id) === false);
  
  console.log('Units to DELETE:', unitsToDelete.map(u => `${u.code} (${u.id})`).join(', '));
  
  // Delete variants using units to be deleted, then delete the units
  for (const unit of unitsToDelete) {
    const variantsInUnit = await prisma.masterVariant.findMany({ where: { unitId: unit.id } });
    console.log(`\nDeleting unit ${unit.code} with ${variantsInUnit.length} variants`);
    
    // Delete pricing rules referencing these variants
    for (const variant of variantsInUnit) {
      const rulesDeleted = await prisma.pricingRule.deleteMany({ 
        where: { variantId: variant.id } 
      });
      if (rulesDeleted.count > 0) {
        console.log(`  Deleted ${rulesDeleted.count} pricing rules for variant ${variant.label}`);
      }
    }
  }
  
  // Now delete the variants
  console.log('\nDeleting variants from units being removed...');
  for (const unit of unitsToDelete) {
    await prisma.masterVariant.deleteMany({ where: { unitId: unit.id } });
  }
  
  // Delete the units
  for (const unit of unitsToDelete) {
    await prisma.masterUnit.delete({ where: { id: unit.id } });
    console.log(`Deleted unit: ${unit.code}`);
  }
  
  console.log('\nUnits after cleanup:');
  const remainingUnits = await prisma.masterUnit.findMany();
  remainingUnits.forEach(u => console.log(`  ${u.code} (${u.type})`));
  
  // ==================================================
  // STEP 2: CREATE CANONICAL VARIANTS
  // ==================================================
  console.log('\n\nSTEP 2: CREATING CANONICAL VARIANTS');
  console.log('====================================\n');
  
  const weightVariants = [
    { value: '100', label: '100g', sortOrder: 1 },
    { value: '125', label: '125g', sortOrder: 2 },
    { value: '150', label: '150g', sortOrder: 3 },
    { value: '200', label: '200g', sortOrder: 4 },
    { value: '250', label: '250g', sortOrder: 5 },
    { value: '300', label: '300g', sortOrder: 6 },
    { value: '350', label: '350g', sortOrder: 7 },
    { value: '400', label: '400g', sortOrder: 8 },
    { value: '500', label: '500g', sortOrder: 9 },
    { value: '750', label: '750g', sortOrder: 10 },
    { value: '1000', label: '1kg', sortOrder: 11 },
    { value: '1500', label: '1.5kg', sortOrder: 12 },
    { value: '2000', label: '2kg', sortOrder: 13 },
    { value: '3000', label: '3kg', sortOrder: 14 },
    { value: '5000', label: '5kg', sortOrder: 15 }
  ];
  
  const quantityVariants = [
    { value: '1', label: '1', sortOrder: 1 },
    { value: '2', label: '2', sortOrder: 2 },
    { value: '3', label: '3', sortOrder: 3 },
    { value: '4', label: '4', sortOrder: 4 },
    { value: '5', label: '5', sortOrder: 5 },
    { value: '6', label: '6', sortOrder: 6 },
    { value: '8', label: '8', sortOrder: 7 },
    { value: '10', label: '10', sortOrder: 8 },
    { value: '12', label: '12', sortOrder: 9 },
    { value: '15', label: '15', sortOrder: 10 },
    { value: '20', label: '20', sortOrder: 11 },
    { value: '25', label: '25', sortOrder: 12 },
    { value: '30', label: '30', sortOrder: 13 },
    { value: '50', label: '50', sortOrder: 14 },
    { value: '100', label: '100', sortOrder: 15 }
  ];
  
  const packVariants = [
    { value: '3', label: '3 Pack', sortOrder: 1 },
    { value: '5', label: '5 Pack', sortOrder: 2 },
    { value: '10', label: '10 Pack', sortOrder: 3 },
    { value: '12', label: '12 Pack', sortOrder: 4 },
    { value: '15', label: '15 Pack', sortOrder: 5 },
    { value: '20', label: '20 Pack', sortOrder: 6 },
    { value: '25', label: '25 Pack', sortOrder: 7 },
    { value: '50', label: '50 Pack', sortOrder: 8 },
    { value: '100', label: '100 Pack', sortOrder: 9 }
  ];
  
  const volumeVariants = [
    { value: '0.125', label: '125ml', sortOrder: 1 },
    { value: '0.25', label: '250ml', sortOrder: 2 },
    { value: '0.5', label: '500ml', sortOrder: 3 },
    { value: '1', label: '1L', sortOrder: 4 },
    { value: '2', label: '2L', sortOrder: 5 },
    { value: '3', label: '3L', sortOrder: 6 },
    { value: '5', label: '5L', sortOrder: 7 },
    { value: '10', label: '10L', sortOrder: 8 }
  ];
  
  // Get canonical unit IDs
  const weightUnit = await prisma.masterUnit.findUnique({ where: { id: canonicalUnits.weight } });
  const quantityUnit = await prisma.masterUnit.findUnique({ where: { id: canonicalUnits.quantity } });
  const packUnit = await prisma.masterUnit.findUnique({ where: { id: canonicalUnits.pack } });
  const volumeUnit = await prisma.masterUnit.findUnique({ where: { id: canonicalUnits.volume } });
  
  // Create weight variants
  console.log('Creating weight variants...');
  for (const v of weightVariants) {
    await prisma.masterVariant.create({
      data: {
        unitId: weightUnit.id,
        value: v.value,
        label: v.label,
        sortOrder: v.sortOrder,
        isActive: true
      }
    });
  }
  
  // Create quantity variants
  console.log('Creating quantity variants...');
  for (const v of quantityVariants) {
    await prisma.masterVariant.create({
      data: {
        unitId: quantityUnit.id,
        value: v.value,
        label: v.label,
        sortOrder: v.sortOrder,
        isActive: true
      }
    });
  }
  
  // Create pack variants
  console.log('Creating pack variants...');
  for (const v of packVariants) {
    await prisma.masterVariant.create({
      data: {
        unitId: packUnit.id,
        value: v.value,
        label: v.label,
        sortOrder: v.sortOrder,
        isActive: true
      }
    });
  }
  
  // Create volume variants
  console.log('Creating volume variants...');
  for (const v of volumeVariants) {
    await prisma.masterVariant.create({
      data: {
        unitId: volumeUnit.id,
        value: v.value,
        label: v.label,
        sortOrder: v.sortOrder,
        isActive: true
      }
    });
  }
  
  console.log('\nVariants created successfully.');
  
  // ==================================================
  // STEP 3: DELETE UNUSED TEMPLATES AND RULES
  // ==================================================
  console.log('\n\nSTEP 3: DELETING UNUSED TEMPLATES');
  console.log('===================================\n');
  
  // Get all templates
  const templates = await prisma.pricingTemplate.findMany();
  
  for (const template of templates) {
    if (template.slug !== 'linear-pricing') {
      console.log(`Deleting template: ${template.name}`);
      // Delete rules first
      await prisma.pricingRule.deleteMany({ where: { templateId: template.id } });
      // Delete template
      await prisma.pricingTemplate.delete({ where: { id: template.id } });
    }
  }
  
  console.log('\nTemplates after cleanup:');
  const remainingTemplates = await prisma.pricingTemplate.findMany();
  remainingTemplates.forEach(t => console.log(`  ${t.name} (${t.slug})`));
  
  // ==================================================
  // STEP 4: CREATE PRICING RULES FOR LINEAR PRICING
  // ==================================================
  console.log('\n\nSTEP 4: CREATING PRICING RULES');
  console.log('==============================\n');
  
  const linearTemplate = await prisma.pricingTemplate.findUnique({ 
    where: { slug: 'linear-pricing' } 
  });
  
  // Get all canonical variants
  const canonicalVariants = await prisma.masterVariant.findMany({
    where: { 
      unitId: { in: Object.values(canonicalUnits) },
      isActive: true
    }
  });
  
  console.log(`Creating ${canonicalVariants.length} pricing rules...`);
  
  let idx = 0;
  for (const variant of canonicalVariants) {
    await prisma.pricingRule.create({
      data: {
        templateId: linearTemplate.id,
        variantId: variant.id,
        percentage: 100,
        sortOrder: idx++
      }
    });
  }
  
  console.log('Pricing rules created successfully.');
  
  // ==================================================
  // FINAL VERIFICATION
  // ==================================================
  console.log('\n\n==================================================');
  console.log('FINAL VERIFICATION');
  console.log('==================================================\n');
  
  const finalUnits = await prisma.masterUnit.findMany();
  console.log('UNITS:');
  finalUnits.forEach(u => console.log(`  ${u.code} (${u.id})`));
  
  const finalVariants = await prisma.masterVariant.findMany({ include: { unit: true } });
  console.log('\nVARIANTS:', finalVariants.length);
  finalVariants.forEach(v => console.log(`  ${v.label} (${v.unit.code})`));
  
  const finalTemplates = await prisma.pricingTemplate.findMany();
  console.log('\nTEMPLATES:', finalTemplates.length);
  finalTemplates.forEach(t => console.log(`  ${t.name}`));
  
  const finalRules = await prisma.pricingRule.findMany();
  console.log('\nRULING RULES:', finalRules.length);
  
  // Check for duplicates
  const variantKeys = finalVariants.map(v => `${v.unitId}_${v.value}`);
  const uniqueKeys = new Set(variantKeys);
  console.log('\nDUPLICATE CHECK:');
  console.log(`  Total variants: ${variantKeys.length}`);
  console.log(`  Unique variants: ${uniqueKeys.size}`);
  console.log(`  Duplicates: ${variantKeys.length - uniqueKeys.size}`);
  
  await prisma.$disconnect();
}

main().catch(e => { 
  console.error('ERROR:', e);
  process.exit(1); 
});