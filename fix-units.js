const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('UPDATING UNIT CODES TO MATCH IMPORT EXPECTATIONS');
  console.log('==================================================\n');
  
  // Update unit codes to match what the import script expects
  const updates = [
    { code: 'kg', newCode: 'g' },     // weight
    { code: 'PC', newCode: 'piece' },  // quantity
    { code: 'PK', newCode: 'pack' },   // pack
    { code: 'L', newCode: 'liter' }    // volume
  ];
  
  for (const update of updates) {
    const unit = await prisma.masterUnit.findFirst({ where: { code: update.code } });
    if (unit) {
      await prisma.masterUnit.update({
        where: { id: unit.id },
        data: { code: update.newCode }
      });
      console.log(`Updated unit: ${update.code} → ${update.newCode}`);
    }
  }
  
  // Verify
  console.log('\n\nUpdated units:');
  const units = await prisma.masterUnit.findMany();
  units.forEach(u => console.log(`  ${u.code} (${u.type})`));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });