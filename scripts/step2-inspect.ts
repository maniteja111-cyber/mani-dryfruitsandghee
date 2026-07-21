import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== STEP 2: INSPECT CURRENT DATABASE ===\n');
  
  console.log('Connected to database:', process.env.DATABASE_URL || 'using .env');
  
  console.log('\nAll tables in connected database:');
  const tables = await prisma.$queryRawUnsafe<{ TABLE_NAME: string }[]>(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
  );
  
  if (tables.length === 0) {
    console.log('  (NO TABLES FOUND)');
  } else {
    tables.forEach(t => console.log('  -', t.TABLE_NAME));
  }
  
  console.log('\nTotal tables:', tables.length);
  
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
