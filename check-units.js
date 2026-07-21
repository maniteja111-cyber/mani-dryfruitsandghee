const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const units = await prisma.masterUnit.findMany({
    where: { code: { in: ['KG', 'G'] } },
    select: { id: true, code: true, name: true, type: true }
  });
  
  console.log('Units in database:');
  units.forEach(u => {
    console.log('ID:', u.id, '- Code:', u.code, '- Name:', u.name, '- Type:', u.type);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });