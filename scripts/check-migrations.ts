import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('=== Checking for Prisma migration history ===\n');
    
    const tables = await prisma.$queryRawUnsafe<{ TABLE_NAME: string }[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND (TABLE_NAME LIKE '_prisma%' OR TABLE_NAME LIKE 'prisma%')`
    );
    
    console.log('Migration tables found:');
    if (tables.length === 0) {
      console.log('  (none)');
    } else {
      tables.forEach(t => console.log('  -', t.TABLE_NAME));
    }
    
    console.log('\n=== Checking _prisma_migrations table ===');
    try {
      const migrations = await prisma.$queryRawUnsafe<{ id: string; checksum: string; finishedAt: string; migrationName: string; logs: string }[]>(
        `SELECT * FROM _prisma_migrations ORDER BY finishedAt DESC LIMIT 10`
      );
      console.log('Recent migrations:');
      migrations.forEach(m => console.log('  -', m.migrationName, '(', m.finishedAt, ')'));
    } catch (e) {
      console.log('_prisma_migrations table not found or empty');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
