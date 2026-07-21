const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('PRICING VERIFICATION');
  console.log('==================================================\n');
  
  const linearTemplate = await prisma.pricingTemplate.findUnique({ 
    where: { slug: 'linear-pricing' } 
  });
  
  const rules = await prisma.pricingRule.findMany({
    where: { templateId: linearTemplate.id },
    include: { variant: { include: { unit: true } } }
  });
  
  console.log(`Linear Pricing Template has ${rules.length} rules\n`);
  
  // Show sample calculations
  console.log('Sample Price Calculations (Base Price ₹850):');
  console.log('==========================================');
  const sampleVariants = ['250g', '500g', '1kg'];
  sampleVariants.forEach(label => {
    const rule = rules.find(r => r.variant.label === label);
    if (rule) {
      const price = 850 * (rule.percentage / 100);
      console.log(`  ${label}: ₹850 × (${rule.percentage}% / 100) = ₹${price}`);
    }
  });
  
  console.log('\n\nSample Price Calculations (Base Price ₹120):');
  console.log('=============================================');
  const qtyVariants = ['5', '10'];
  qtyVariants.forEach(label => {
    const rule = rules.find(r => r.variant.label === label);
    if (rule) {
      const price = 120 * (rule.percentage / 100);
      console.log(`  ${label}: ₹120 × (${rule.percentage}% / 100) = ₹${price}`);
    }
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });