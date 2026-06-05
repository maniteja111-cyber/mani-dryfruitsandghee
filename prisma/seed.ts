import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
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

   const pickles = await prisma.category.upsert({
     where: { slug: 'pickles' },
     update: {},
     create: {
       name: 'Pickles',
       slug: 'pickles',
       description: 'Authentic Indian pickles made with traditional recipes'
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

   // Create products with JSON images
   const products = [
     {
       name: 'Premium Almonds',
       slug: 'premium-almonds',
       description: 'High-quality almonds rich in nutrients',
       price: 800,
       discountPrice: 720,
       stock: 100,
       images: [{ url: 'https://picsum.photos/seed/almonds/400/400' }],
       categoryId: dryFruits.id
     },
     {
       name: 'Cashews',
       slug: 'cashews',
       description: 'Delicious cashews perfect for snacking',
       price: 1200,
       stock: 50,
       images: [{ url: 'https://picsum.photos/seed/cashews/400/400' }],
       categoryId: dryFruits.id
     },
     {
       name: 'Mango Pickle',
       slug: 'mango-pickle',
       description: 'Spicy mango pickle made with traditional spices',
       price: 250,
       stock: 30,
       images: [{ url: 'https://picsum.photos/seed/pickle/400/400' }],
       categoryId: pickles.id
     },
     {
       name: 'Pure Cow Ghee',
       slug: 'pure-cow-ghee',
       description: '100% pure ghee made from cow milk',
       price: 600,
       discountPrice: 550,
       stock: 20,
       images: [{ url: 'https://picsum.photos/seed/ghee/400/400' }],
       categoryId: ghee.id
     }
   ]

const createdProducts = []
    for (const product of products) {
      const p = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          ...product,
          images: JSON.stringify(product.images)
        }
      })
      createdProducts.push(p)
    }

   // Create settings with actual product IDs
   const productIds = createdProducts.map(p => p.id)
   const settings = [
     { key: 'siteName', value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES' },
     { key: 'logo', value: '' },
     { key: 'themeColor', value: '#ffd862' },
     { key: 'whatsappNumber', value: '919515019393' },
     { key: 'phone', value: '+91 9515019393' },
     { key: 'email', value: 'manidgs9393@gmail.com' },
     { key: 'address', value: '123 Main Street, City, State 123456' },
     { key: 'banners', value: JSON.stringify([
       { image: 'https://picsum.photos/seed/banner1/1200/400', title: 'MANI DRY FRUITS STORES', description: 'Healthy products delivered to your doorstep' },
       { image: 'https://picsum.photos/seed/banner2/1200/400', title: 'Fresh Pickles', description: 'Authentic taste' }
     ]) },
     { key: 'seoTitle', value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES - Premium Quality Products' },
     { key: 'seoDescription', value: 'Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com' },
     { key: 'heroTitle', value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES' },
     { key: 'heroSubtitle', value: 'Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com' },
     { key: 'featuredProducts', value: JSON.stringify(productIds) },
     { key: 'todaysOffers', value: JSON.stringify(productIds) }
   ]

for (const setting of settings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      })
    }

   // Create admin user (for demo, use phone 9999999999)
   await prisma.user.upsert({
     where: { phone: '9999999999' },
     update: {},
     create: {
       phone: '9999999999',
       name: 'Admin',
       password: '$2b$10$dummy.hash.for.admin'
     }
   })

   console.log('Seed data created successfully')
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