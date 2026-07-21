import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME
  `
  console.log('Tables:', tables)
  
  const masterUnits = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM master_units
  `
  console.log('Master units count:', masterUnits)
  
  const masterVariants = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM master_variants
  `
  console.log('Master variants count:', masterVariants)
  
  const pricingTemplates = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM pricing_templates
  `
  console.log('Pricing templates count:', pricingTemplates)
  
  const products = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM products
  `
  console.log('Products count:', products)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())