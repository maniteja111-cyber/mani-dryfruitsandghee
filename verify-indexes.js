const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('Database Index Verification');
  console.log('==================================================');
  
  // Query MySQL information_schema for unique constraints on master_variants
  const indexes = await prisma.$queryRaw`
    SELECT 
      INDEX_NAME,
      NON_UNIQUE,
      COLUMN_NAME,
      SEQ_IN_INDEX
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'master_variants'
    ORDER BY INDEX_NAME, SEQ_IN_INDEX
  `;
  
  console.log('Indexes on master_variants table:');
  indexes.forEach(idx => {
    console.log(`Index: ${idx.INDEX_NAME}, NonUnique: ${idx.NON_UNIQUE}, Column: ${idx.COLUMN_NAME}, Seq: ${idx.SEQ_IN_INDEX}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });