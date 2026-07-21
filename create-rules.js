const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('CREATING PRICING RULES AND CLEANING TEMPLATES');
  console.log('==================================================\n');
  
  // Get Linear Pricing template
  const linearTemplate = await prisma.pricingTemplate.findUnique({ 
    where: { slug: 'linear-pricing' } 
  });
  
  if (!linearTemplate) {
    console.log('Linear Pricing template not found. Creating...');
    await prisma.pricingTemplate.create({
      data: {
        name: 'Linear Pricing',
        slug: 'linear-pricing',
        description: 'Standard linear pricing template',
        isActive: true,
        sortOrder: 1,
        isDefault: true
      }
    });
  }
  
  // Get the template ID
  const template = await prisma.pricingTemplate.findUnique({ 
    where: { slug: 'linear-pricing' } 
  });
  
  console.log('Linear Pricing template ID:', template.id);
  
  // Get all variants
  const variants = await prisma.masterVariant.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  
  console.log(`\nCreating ${variants.length} pricing rules...`);
  
  let idx = 0;
  for (const variant of variants) {
    await prisma.pricingRule.create({
      data: {
        templateId: template.id,
        variantId: variant.id,
        percentage: 100,
        sortOrder: idx++
      }
    });
    console.log(`  Created rule for: ${variant.label}`);
  }
  
  // Delete unused templates
  console.log('\nDeleting unused templates...');
  const templatesToDelete = await prisma.pricingTemplate.findMany({
    where: { slug: { not: 'linear-pricing' } }
  });
  
  for (const t of templatesToDelete) {
    await prisma.pricingRule.deleteMany({ where: { templateId: t.id } });
    await prisma.pricingTemplate.delete({ where: { id: t.id } });
    console.log(`  Deleted: ${t.name}`);
  }
  
  console.log('\nDone!');
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });