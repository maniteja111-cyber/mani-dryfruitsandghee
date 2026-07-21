const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  console.log('PRICING RULE VERIFICATION REPORT');
  console.log('==================================================\n');
  
  const linearTemplate = await prisma.pricingTemplate.findUnique({ 
    where: { slug: 'linear-pricing' } 
  });
  
  const rules = await prisma.pricingRule.findMany({
    where: { templateId: linearTemplate.id },
    include: { variant: { include: { unit: true } } },
    orderBy: { variant: { label: 'asc' } }
  });
  
  let correct = 0;
  let incorrect = 0;
  let missing = 0;
  
  console.log('WEIGHT VARIANTS:');
  console.log('----------------');
  const weightLabels = ['100g', '125g', '150g', '200g', '250g', '300g', '350g', '400g', '500g', '750g', '1kg', '1.5kg', '2kg', '3kg', '5kg'];
  weightLabels.forEach(label => {
    const rule = rules.find(r => r.variant.label === label);
    const expected = PERCENTAGES[label];
    if (rule) {
      const status = rule.percentage === expected ? '✓' : '✗';
      if (rule.percentage === expected) correct++; else incorrect++;
      console.log(`  ${status} ${label}: ${rule.percentage}% (expected: ${expected}%)`);
    } else {
      console.log(`  ✗ ${label}: MISSING`);
      missing++;
    }
  });
  
  console.log('\nQUANTITY VARIANTS:');
  console.log('-----------------');
  const qtyLabels = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '15', '20', '25', '30', '50', '100'];
  qtyLabels.forEach(label => {
    const rule = rules.find(r => r.variant.label === label);
    const expected = PERCENTAGES[label];
    if (rule) {
      const status = rule.percentage === expected ? '✓' : '✗';
      if (rule.percentage === expected) correct++; else incorrect++;
      console.log(`  ${status} ${label}: ${rule.percentage}% (expected: ${expected}%)`);
    } else {
      console.log(`  ✗ ${label}: MISSING`);
      missing++;
    }
  });
  
  console.log('\nPACK VARIANTS:');
  console.log('-------------');
  const packLabels = ['3 Pack', '5 Pack', '10 Pack', '12 Pack', '15 Pack', '20 Pack', '25 Pack', '50 Pack', '100 Pack'];
  packLabels.forEach(label => {
    const rule = rules.find(r => r.variant.label === label);
    const expected = PERCENTAGES[label];
    if (rule) {
      const status = rule.percentage === expected ? '✓' : '✗';
      if (rule.percentage === expected) correct++; else incorrect++;
      console.log(`  ${status} ${label}: ${rule.percentage}% (expected: ${expected}%)`);
    } else {
      console.log(`  ✗ ${label}: MISSING`);
      missing++;
    }
  });
  
  console.log('\nVOLUME VARIANTS:');
  console.log('--------------');
  const volLabels = ['125ml', '250ml', '500ml', '1L', '2L', '3L', '5L', '10L'];
  volLabels.forEach(label => {
    const rule = rules.find(r => r.variant.label === label);
    const expected = PERCENTAGES[label];
    if (rule) {
      const status = rule.percentage === expected ? '✓' : '✗';
      if (rule.percentage === expected) correct++; else incorrect++;
      console.log(`  ${status} ${label}: ${rule.percentage}% (expected: ${expected}%)`);
    } else {
      console.log(`  ✗ ${label}: MISSING`);
      missing++;
    }
  });
  
  console.log('\n==================================================');
  console.log('SUMMARY');
  console.log('==================================================');
  console.log(`Total rules: ${rules.length}`);
  console.log(`Correct: ${correct}`);
  console.log(`Incorrect: ${incorrect}`);
  console.log(`Missing: ${missing}`);
  
  if (incorrect === 0 && missing === 0) {
    console.log('\n✅ All pricing rules are correctly configured!');
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });