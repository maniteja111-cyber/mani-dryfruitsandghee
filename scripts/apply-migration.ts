import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Starting migration...');

    const createTables = [
      `CREATE TABLE IF NOT EXISTS \`master_units\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`code\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(191) NOT NULL,
        \`type\` VARCHAR(191) NOT NULL,
        \`symbol\` VARCHAR(191) NOT NULL,
        \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
        \`isActive\` BOOLEAN NOT NULL DEFAULT true,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`master_units_code_key\`(\`code\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS \`master_variants\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`unitId\` VARCHAR(191) NOT NULL,
        \`value\` VARCHAR(191) NOT NULL,
        \`label\` VARCHAR(191) NOT NULL,
        \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
        \`isActive\` BOOLEAN NOT NULL DEFAULT true,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`master_variants_unitId_value_key\`(\`unitId\`, \`value\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS \`pricing_templates\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(191) NOT NULL,
        \`slug\` VARCHAR(191) NOT NULL,
        \`description\` VARCHAR(191) NULL,
        \`isActive\` BOOLEAN NOT NULL DEFAULT true,
        \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
        \`isDefault\` BOOLEAN NOT NULL DEFAULT false,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`pricing_templates_slug_key\`(\`slug\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS \`pricing_rules\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`templateId\` VARCHAR(191) NOT NULL,
        \`variantId\` VARCHAR(191) NOT NULL,
        \`percentage\` DOUBLE NOT NULL,
        \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`pricing_rules_templateId_variantId_key\`(\`templateId\`, \`variantId\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS \`product_extensions\` (
        \`productId\` VARCHAR(191) NOT NULL,
        \`unitTypeId\` VARCHAR(191) NULL,
        \`basePrice\` DOUBLE NULL,
        \`pricingTemplateId\` VARCHAR(191) NULL,
        \`stockQuantity\` DOUBLE NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        INDEX \`product_extensions_unitTypeId_idx\`(\`unitTypeId\`),
        INDEX \`product_extensions_pricingTemplateId_idx\`(\`pricingTemplateId\`),
        PRIMARY KEY (\`productId\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS \`product_product_variants\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`productId\` VARCHAR(191) NOT NULL,
        \`variantId\` VARCHAR(191) NOT NULL,
        \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
        \`isActive\` BOOLEAN NOT NULL DEFAULT true,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE INDEX \`product_product_variants_productId_variantId_key\`(\`productId\`, \`variantId\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    ];

    for (const sql of createTables) {
      const firstLine = sql.split('\n')[0].trim();
      console.log('Creating table:', firstLine);
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('All tables created. Now adding foreign keys...');

    const dropForeignKeys = [
      'ALTER TABLE \`master_variants\` DROP FOREIGN KEY IF EXISTS \`master_variants_unitId_fkey\`;',
      'ALTER TABLE \`pricing_rules\` DROP FOREIGN KEY IF EXISTS \`pricing_rules_templateId_fkey\`;',
      'ALTER TABLE \`pricing_rules\` DROP FOREIGN KEY IF EXISTS \`pricing_rules_variantId_fkey\`;',
      'ALTER TABLE \`product_extensions\` DROP FOREIGN KEY IF EXISTS \`product_extensions_productId_fkey\`;',
      'ALTER TABLE \`product_extensions\` DROP FOREIGN KEY IF EXISTS \`product_extensions_unitTypeId_fkey\`;',
      'ALTER TABLE \`product_extensions\` DROP FOREIGN KEY IF EXISTS \`product_extensions_pricingTemplateId_fkey\`;',
      'ALTER TABLE \`product_product_variants\` DROP FOREIGN KEY IF EXISTS \`product_product_variants_productId_fkey\`;',
      'ALTER TABLE \`product_product_variants\` DROP FOREIGN KEY IF EXISTS \`product_product_variants_variantId_fkey\`;'
    ];

    for (const sql of dropForeignKeys) {
      const fkName = sql.match(/DROP FOREIGN KEY IF EXISTS \`([^`]+)\`/)?.[1] || sql;
      console.log('Dropping FK:', fkName);
      await prisma.$executeRawUnsafe(sql);
    }

    const addForeignKeys = [
      'ALTER TABLE \`master_variants\` ADD CONSTRAINT \`master_variants_unitId_fkey\` FOREIGN KEY (\`unitId\`) REFERENCES \`master_units\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;',
      'ALTER TABLE \`pricing_rules\` ADD CONSTRAINT \`pricing_rules_templateId_fkey\` FOREIGN KEY (\`templateId\`) REFERENCES \`pricing_templates\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;',
      'ALTER TABLE \`pricing_rules\` ADD CONSTRAINT \`pricing_rules_variantId_fkey\` FOREIGN KEY (\`variantId\`) REFERENCES \`master_variants\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;',
      'ALTER TABLE \`product_extensions\` ADD CONSTRAINT \`product_extensions_unitTypeId_fkey\` FOREIGN KEY (\`unitTypeId\`) REFERENCES \`master_units\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;',
      'ALTER TABLE \`product_extensions\` ADD CONSTRAINT \`product_extensions_pricingTemplateId_fkey\` FOREIGN KEY (\`pricingTemplateId\`) REFERENCES \`pricing_templates\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;'
    ];

    for (const sql of addForeignKeys) {
      const fkName = sql.match(/ADD CONSTRAINT \`([^`]+)\`/)?.[1] || sql;
      console.log('Adding FK:', fkName);
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        console.error('Failed to add FK:', fkName, err);
        throw err;
      }
    }

    console.log('\nMigration completed successfully');
    console.log('Note: FKs to products table skipped because products table does not exist yet.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
