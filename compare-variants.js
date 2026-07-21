const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('STEP: Detailed Variant Comparison for 250g');
  console.log('==================================================');
  
  // Find duplicates by label
  const almondVariants = await prisma.masterVariant.findMany({
    where: { label: '250g' },
    include: { unit: true },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log('Variants with label "250g":');
  almondVariants.forEach((v, i) => {
    console.log('\n--- Variant', i + 1, '---');
    console.log('ID:', v.id);
    console.log('unitId:', v.unitId);
    console.log('Unit Name:', v.unit.name);
    console.log('Value:', v.value);
    console.log('typeof(value):', typeof v.value);
    console.log('length(value):', v.value.length);
    console.log('ASCII codes:', [...v.value].map(c => c.charCodeAt(0)));
    console.log('createdAt:', v.createdAt);
    console.log('updatedAt:', v.updatedAt);
  });
  
  console.log('\n\n==================================================');
  console.log('STEP: Detailed Variant Comparison for 500g');
  console.log('==================================================');
  
  const variants500g = await prisma.masterVariant.findMany({
    where: { label: '500g' },
    include: { unit: true },
    orderBy: { createdAt: 'asc' }
  });
  
  variants500g.forEach((v, i) => {
    console.log('\n--- Variant', i + 1, '---');
    console.log('ID:', v.id);
    console.log('unitId:', v.unitId);
    console.log('Unit Name:', v.unit.name);
    console.log('Value:', v.value);
    console.log('typeof(value):', typeof v.value);
    console.log('length(value):', v.value.length);
    console.log('ASCII codes:', [...v.value].map(c => c.charCodeAt(0)));
    console.log('createdAt:', v.createdAt);
    console.log('updatedAt:', v.updatedAt);
  });
  
  console.log('\n\n==================================================');
  console.log('STEP: Compare 1kg variants');
  console.log('==================================================');
  
  const variants1kg = await prisma.masterVariant.findMany({
    where: { label: '1kg' },
    include: { unit: true },
    orderBy: { createdAt: 'asc' }
  });
  
  variants1kg.forEach((v, i) => {
    console.log('\n--- Variant', i + 1, '---');
    console.log('ID:', v.id);
    console.log('unitId:', v.unitId);
    console.log('Unit Name:', v.unit.name);
    console.log('Value:', v.value);
    console.log('typeof(value):', typeof v.value);
    console.log('length(value):', v.value.length);
    console.log('ASCII codes:', [...v.value].map(c => c.charCodeAt(0)));
    console.log('createdAt:', v.createdAt);
    console.log('updatedAt:', v.updatedAt);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });