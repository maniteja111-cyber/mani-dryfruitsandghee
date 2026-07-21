import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
   // Create units first
   const weightUnit = await prisma.masterUnit.upsert({
     where: { code: 'KG' },
     update: {},
     create: {
       code: 'KG',
       name: 'Kilogram',
       type: 'weight',
       sortOrder: 1,
       isActive: true,
       symbol: 'kg'
     }
   })

   const pieceUnit = await prisma.masterUnit.upsert({
     where: { code: 'PC' },
     update: {},
     create: {
       code: 'PC',
       name: 'Piece',
       type: 'quantity',
       sortOrder: 2,
       isActive: true,
       symbol: 'pcs'
     }
   })

   const packUnit = await prisma.masterUnit.upsert({
     where: { code: 'PK' },
     update: {},
     create: {
       code: 'PK',
       name: 'Pack',
       type: 'pack',
       sortOrder: 3,
       isActive: true,
       symbol: 'pk'
     }
   })

   const litreUnit = await prisma.masterUnit.upsert({
     where: { code: 'L' },
     update: {},
     create: {
       code: 'L',
       name: 'Litre',
       type: 'volume',
       sortOrder: 4,
       isActive: true,
       symbol: 'L'
     }
   })

   // Create variants for each unit type
   const weightVariants = await Promise.all([
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: weightUnit.id, value: '250' } }, update: {}, create: { unitId: weightUnit.id, value: '250', label: '250g', sortOrder: 1, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: weightUnit.id, value: '500' } }, update: {}, create: { unitId: weightUnit.id, value: '500', label: '500g', sortOrder: 2, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: weightUnit.id, value: '1' } }, update: {}, create: { unitId: weightUnit.id, value: '1', label: '1kg', sortOrder: 3, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: weightUnit.id, value: '2' } }, update: {}, create: { unitId: weightUnit.id, value: '2', label: '2kg', sortOrder: 4, isActive: true } }),
   ])

   const quantityVariants = await Promise.all([
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: pieceUnit.id, value: '3' } }, update: {}, create: { unitId: pieceUnit.id, value: '3', label: '3 Pieces', sortOrder: 1, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: pieceUnit.id, value: '5' } }, update: {}, create: { unitId: pieceUnit.id, value: '5', label: '5 Pieces', sortOrder: 2, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: pieceUnit.id, value: '10' } }, update: {}, create: { unitId: pieceUnit.id, value: '10', label: '10 Pieces', sortOrder: 3, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: pieceUnit.id, value: '25' } }, update: {}, create: { unitId: pieceUnit.id, value: '25', label: '25 Pieces', sortOrder: 4, isActive: true } }),
   ])

   const packVariants = await Promise.all([
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: packUnit.id, value: '3' } }, update: {}, create: { unitId: packUnit.id, value: '3', label: '3 Pack', sortOrder: 1, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: packUnit.id, value: '5' } }, update: {}, create: { unitId: packUnit.id, value: '5', label: '5 Pack', sortOrder: 2, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: packUnit.id, value: '10' } }, update: {}, create: { unitId: packUnit.id, value: '10', label: '10 Pack', sortOrder: 3, isActive: true } }),
   ])

   const volumeVariants = await Promise.all([
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: litreUnit.id, value: '250' } }, update: {}, create: { unitId: litreUnit.id, value: '250', label: '250ml', sortOrder: 1, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: litreUnit.id, value: '500' } }, update: {}, create: { unitId: litreUnit.id, value: '500', label: '500ml', sortOrder: 2, isActive: true } }),
     prisma.masterVariant.upsert({ where: { unitId_value: { unitId: litreUnit.id, value: '1' } }, update: {}, create: { unitId: litreUnit.id, value: '1', label: '1L', sortOrder: 3, isActive: true } }),
   ])

   // Create categories
   const dryFruits = await prisma.category.upsert({
     where: { slug: 'dry-fruits' },
     update: {},
     create: {
       name: 'Dry Fruits',
       slug: 'dry-fruits',
       description: 'Premium quality dry fruits from around the world'
     }
   })

   const ghee = await prisma.category.upsert({
     where: { slug: 'ghee' },
     update: {},
     create: {
       name: 'Ghee',
       slug: 'ghee',
       description: 'Pure and fresh ghee made from cow milk'
     }
   })

   const pickles = await prisma.category.upsert({
     where: { slug: 'pickles' },
     update: {},
     create: {
       name: 'Pickles',
       slug: 'pickles',
       description: 'Authentic Indian pickles made with traditional recipes'
     }
   })

   // Pricing template
   const linearPricing = await prisma.pricingTemplate.upsert({
     where: { slug: 'linear-pricing' },
     update: {},
     create: {
       name: 'Linear Pricing',
       slug: 'linear-pricing',
       description: 'Standard linear pricing template',
       isActive: true,
       sortOrder: 1,
       isDefault: true
     }
   })

   // 10 products with different types
   const products = [
     { name: 'Premium Almonds', slug: 'premium-almonds', category: dryFruits, type: 'weight', basePrice: 850, stockKg: 50, variants: weightVariants.slice(0, 3) },
     { name: 'Cashew Pieces', slug: 'cashew-pieces', category: dryFruits, type: 'quantity', basePrice: 120, stockQty: 100, variants: quantityVariants.slice(0, 3) },
     { name: 'Almond Pack', slug: 'almond-pack', category: dryFruits, type: 'pack', basePrice: 250, stockQty: 30, variants: packVariants.slice(0, 2) },
     { name: 'Coconut Oil 1L', slug: 'coconut-oil-1l', category: ghee, type: 'volume', basePrice: 320, stockLitres: 5, variants: volumeVariants },
     { name: 'Pure Ghee 1L', slug: 'pure-ghee-1l', category: ghee, type: 'volume', basePrice: 550, stockLitres: 2, variants: volumeVariants },
     { name: 'Organic Walnuts', slug: 'organic-walnuts', category: dryFruits, type: 'weight', basePrice: 1200, stockKg: 20, variants: weightVariants },
     { name: 'Pistachios', slug: 'pistachios', category: dryFruits, type: 'weight', basePrice: 950, stockKg: 15, variants: weightVariants },
     { name: 'Raisins Pack', slug: 'raisins-pack', category: dryFruits, type: 'pack', basePrice: 180, stockQty: 50, variants: packVariants },
     { name: 'Butter Chicken', slug: 'butter-chicken', category: pickles, type: 'quantity', basePrice: 85, stockQty: 200, variants: quantityVariants },
     { name: 'Mango Pickle', slug: 'mango-pickle', category: pickles, type: 'quantity', basePrice: 95, stockQty: 150, variants: quantityVariants }
   ]

   for (const p of products) {
     const product = await prisma.product.upsert({
       where: { slug: p.slug },
       update: {},
       create: {
         name: p.name,
         slug: p.slug,
         description: `Premium quality ${p.name.toLowerCase()}`,
         shortDescription: `Authentic ${p.name.toLowerCase()}`,
         images: JSON.stringify(['https://picsum.photos/seed/' + p.slug + '/400/400']),
         categoryId: p.category.id,
         isFeatured: p.name.includes('Premium') || p.name.includes('Organic'),
         isTodayOffer: p.name.includes('Ghee'),
         isVisible: true,
         productOverview: `High-quality ${p.name.toLowerCase()}`,
         whyChoose: '100% natural ingredients',
         ingredients: 'Pure ' + p.name,
         shelfLife: '12 months',
         origin: 'India',
         benefits: 'Rich in nutrients',
         pricePerKg: p.type === 'weight' ? p.basePrice : null,
         stockGrams: p.type === 'weight' ? (p.stockKg! * 1000) : 0,
         extension: {
           create: {
             basePrice: p.basePrice,
             unitTypeId: p.type === 'weight' ? weightUnit.id : p.type === 'quantity' ? pieceUnit.id : p.type === 'pack' ? packUnit.id : litreUnit.id,
             pricingTemplateId: linearPricing.id,
             stockQuantity: p.type === 'weight' ? undefined : ((p.stockQty || 0) || (p.stockLitres! * 1000))
           }
         }
       }
     })

     // Link variants to product
     for (const variant of p.variants) {
       await prisma.productProductVariant.upsert({
         where: {
           productId_variantId: {
             productId: product.id,
             variantId: variant.id
           }
         },
         update: {},
         create: { productId: product.id, variantId: variant.id }
       })
     }
   }

   // Create settings
   await prisma.setting.upsert({
     where: { key: 'siteName' },
     update: { value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES' },
     create: { key: 'siteName', value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES' }
   })

   // Create admin user
   await prisma.user.upsert({
     where: { phone: '9999999999' },
     update: {},
     create: {
       phone: '9999999999',
       name: 'Admin',
       password: '$2b$10$dummy.hash.for.admin'
     }
   })

   console.log('Seed data created successfully with 10 products and variants')
 }

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })