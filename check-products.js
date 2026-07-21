const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check products using each unit
  const products = await prisma.product.findMany({
    include: { 
      extension: { select: { unitTypeId: true, basePrice: true, pricingTemplateId: true } },
      productVariants: { include: { variant: { include: { unit: true } } } }
    }
  });
  
  console.log('Products and their variants:');
  products.forEach(p => {
    console.log('\n' + p.name + ' (' + p.slug + ')');
    console.log('  Base Price: ' + p.extension?.basePrice);
    console.log('  Template ID: ' + p.extension?.pricingTemplateId);
    p.productVariants.forEach(pv => {
      console.log('    - ' + pv.variant.label + ': ID=' + pv.variantId + ', Unit=' + pv.variant.unit.name);
    });
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });