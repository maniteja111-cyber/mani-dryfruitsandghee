const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('CHECKING VARIANT LABELS');
  console.log('==================================================\n');
  
  const variants = await prisma.masterVariant.findMany({
    where: { isActive: true },
    include: { unit: true },
    orderBy: { label: 'asc' }
  });
  
  console.log('All active variants:');
  variants.forEach(v => {
    console.log(`  "${v.label}" (unit: ${v.unit.code}, type: ${v.unit.type})`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });