const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Check if pricing_templates table exists and its columns
    const columns = await prisma.$queryRaw`
      SHOW COLUMNS FROM pricing_templates
    `
    console.log('pricing_templates columns:', columns)
  } catch (e) {
    console.error('Error:', e.message)
  }
  
  try {
    // Check if pricing_rules table exists
    const columns = await prisma.$queryRaw`
      SHOW COLUMNS FROM pricing_rules
    `
    console.log('pricing_rules columns:', columns)
  } catch (e) {
    console.error('pricing_rules table error:', e.message)
  }
  
  await prisma.$disconnect()
}

main()