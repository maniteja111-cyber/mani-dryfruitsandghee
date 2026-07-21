import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  try {
    console.log('=== Current DATABASE_URL ===');
    console.log(process.env.DATABASE_URL || 'Not set in env');
    
    console.log('\n=== All databases on server ===');
    const databases = await prisma.$queryRawUnsafe<{ Database: string }[]>(
      `SHOW DATABASES`
    );
    console.log(databases.map(d => d.Database).join('\n'));
    
    console.log('\n=== Current database ===');
    const currentDb = await prisma.$queryRawUnsafe<{ db: string }[]>(
      `SELECT DATABASE() as db`
    );
    console.log('Current DB:', currentDb[0]?.db);
    
    console.log('\n=== Tables in current database ===');
    const tables = await prisma.$queryRawUnsafe<{ TABLE_NAME: string }[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
    );
    console.log(tables.map(t => t.TABLE_NAME).join('\n') || '(none)');
  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();
