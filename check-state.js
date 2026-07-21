const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('CURRENT STATE AFTER UNIT DELETION');
  console.log('==================================================\n');
  
  const variants = await prisma.masterVariant.findMany({ include: { unit: true } });
  
  console.log('Remaining variants:');
  variants.forEach(v => {
    console.log(`  ${v.id}: ${v.label} (value: ${v.value}, unit: ${v.unit.code})`);
  });
  
  console.log('\n\nTemplates:');
  const templates = await prisma.pricingTemplate.findMany();
  templates.forEach(t => console.log(`  ${t.name}: ${t.rules?.length || 0} rules`));
  
  console.log('\n\nPricing rules:');
  const rules = await prisma.pricingRule.findMany();
  console.log('Total rules:', rules.length);
  rules.forEach(r => {
    console.log(`  ${r.id}: ${r.percentage}%`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });