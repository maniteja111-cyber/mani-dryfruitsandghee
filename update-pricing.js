const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Correct label -> percentage mapping
const PERCENTAGES = {
  // Weight (in grams)
  '100g': 10,
  '125g': 12.5,
  '150g': 15,
  '200g': 20,
  '250g': 25,
  '300g': 30,
  '350g': 35,
  '400g': 40,
  '500g': 50,
  '750g': 75,
  '1kg': 100,
  '1.5kg': 150,
  '2kg': 200,
  '3kg': 300,
  '5kg': 500,
  
  // Quantity (labels are just numbers)
  '1': 100,
  '2': 200,
  '3': 300,
  '4': 400,
  '5': 500,
  '6': 600,
  '8': 800,
  '10': 1000,
  '12': 1200,
  '15': 1500,
  '20': 2000,
  '25': 2500,
  '30': 3000,
  '50': 5000,
  '100': 10000,
  
  // Pack
  '3 Pack': 300,
  '5 Pack': 500,
  '10 Pack': 1000,
  '12 Pack': 1200,
  '15 Pack': 1500,
  '20 Pack': 2000,
  '25 Pack': 2500,
  '50 Pack': 5000,
  '100 Pack': 10000,
  
  // Volume (in litres)
  '125ml': 12.5,
  '250ml': 25,
  '500ml': 50,
  '1L': 100,
  '2L': 200,
  '3L': 300,
  '5L': 500,
  '10L': 1000
};

async function main() {
  console.log('==================================================');
  console.log('UPDATING PRICING RULES (CORRECTED)');
  console.log('==================================================\n');
  
  const linearTemplate = await prisma.pricingTemplate.findUnique({ 
    where: { slug: 'linear-pricing' } 
  });
  
  const rules = await prisma.pricingRule.findMany({
    where: { templateId: linearTemplate.id },
    include: { variant: true }
  });
  
  const updates = [];
  let updatedCount = 0;
  
  for (const rule of rules) {
    const label = rule.variant.label;
    const newPercentage = PERCENTAGES[label];
    
    if (newPercentage === undefined) {
      console.log(`WARNING: No percentage defined for "${label}"`);
      continue;
    }
    
    if (rule.percentage !== newPercentage) {
      updates.push({
        label: label,
        oldPercentage: rule.percentage,
        newPercentage: newPercentage
      });
      
      await prisma.pricingRule.update({
        where: { id: rule.id },
        data: { percentage: newPercentage }
      });
      updatedCount++;
    }
  }
  
  console.log('UPDATED RULES:');
  console.log('==============');
  updates.forEach(u => {
    console.log(`  ${u.label}: ${u.oldPercentage}% → ${u.newPercentage}%`);
  });
  
  console.log(`\nTotal rules updated: ${updatedCount}`);
  
  // Verification
  console.log('\n\n==================================================');
  console.log('VERIFICATION');
  console.log('==================================================\n');
  
  const verifyRules = await prisma.pricingRule.findMany({
    where: { templateId: linearTemplate.id },
    include: { variant: { include: { unit: true } } },
    orderBy: { variant: { label: 'asc' } }
  });
  
  console.log(`Total rules: ${verifyRules.length}`);
  console.log('\nAll rules:');
  verifyRules.forEach(r => {
    console.log(`  ${r.variant.label}: ${r.percentage}%`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });