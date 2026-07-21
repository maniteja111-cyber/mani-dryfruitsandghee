const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check the actual table structure
  console.log('==================================================');
  console.log('Database Schema Verification');
  console.log('==================================================');
  
  // Check if PricingRule model exists and how it's structured
  try {
    const rules = await prisma.$queryRaw`SELECT * FROM pricing_rules LIMIT 1`;
    console.log('PricingRule table exists');
    console.log('Columns:', Object.keys(rules[0] || {}));
  } catch (e) {
    console.log('PricingRule table structure:', e.message);
  }
  
  // Check if rules field in PricingTemplate is a relation or JSON
  const templateWithRules = await prisma.pricingTemplate.findFirst({
    include: { rules: true }
  });
  
  if (templateWithRules) {
    console.log('\nTemplate with rules:');
    console.log('Rules type:', typeof templateWithRules.rules);
    console.log('Rules:', templateWithRules.rules);
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });