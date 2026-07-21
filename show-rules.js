const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('CURRENT PRICING RULES');
  console.log('==================================================\n');
  
  const linearTemplate = await prisma.pricingTemplate.findUnique({ 
    where: { slug: 'linear-pricing' } 
  });
  
  const rules = await prisma.pricingRule.findMany({
    where: { templateId: linearTemplate.id },
    include: { variant: { include: { unit: true } } },
    orderBy: { variant: { sortOrder: 'asc' } }
  });
  
  console.log('Template:', linearTemplate.name);
  console.log('Rules:', rules.length);
  console.log('\nCurrent rules:');
  rules.forEach(r => {
    console.log(`  ${r.variant.label}: ${r.percentage}%`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });