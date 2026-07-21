const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('FIXING VARIANT VALUES');
  console.log('==================================================\n');
  
  // Get canonical unit IDs
  const weightUnit = await prisma.masterUnit.findUnique({ where: { code: 'kg' } });
  const quantityUnit = await prisma.masterUnit.findUnique({ where: { code: 'PC' } });
  const packUnit = await prisma.masterUnit.findUnique({ where: { code: 'PK' } });
  const volumeUnit = await prisma.masterUnit.findUnique({ where: { code: 'L' } });
  
  console.log('Unit IDs:');
  console.log('  Weight (kg):', weightUnit.id);
  console.log('  Quantity (PC):', quantityUnit.id);
  console.log('  Pack (PK):', packUnit.id);
  console.log('  Volume (L):', volumeUnit.id);
  
  // Define correct variants
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
  
  // Delete all existing variants
  console.log('Deleting existing variants...');
  await prisma.masterVariant.deleteMany({});
  console.log('All variants deleted.');
  
  // Create correct weight variants
  console.log('\nCreating weight variants...');
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
    console.log(`  Created: ${v.label}`);
  }
  
  // Create correct quantity variants
  console.log('\nCreating quantity variants...');
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
    console.log(`  Created: ${v.label}`);
  }
  
  // Create correct pack variants
  console.log('\nCreating pack variants...');
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
    console.log(`  Created: ${v.label}`);
  }
  
  // Create correct volume variants
  console.log('\nCreating volume variants...');
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
    console.log(`  Created: ${v.label}`);
  }
  
  console.log('\n\nAll variants created successfully.');
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });