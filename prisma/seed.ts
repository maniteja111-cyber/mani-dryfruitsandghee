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

  // Create products
  const products = [
    {
      name: 'Premium Almonds',
      slug: 'premium-almonds',
      description: 'High-quality almonds rich in nutrients',
      price: 800,
      discountPrice: 720,
      stock: 100,
      images: ['https://example.com/almonds.jpg'],
      categoryId: dryFruits.id
    },
    {
      name: 'Cashews',
      slug: 'cashews',
      description: 'Delicious cashews perfect for snacking',
      price: 1200,
      stock: 50,
      images: ['https://example.com/cashews.jpg'],
      categoryId: dryFruits.id
    },
    {
      name: 'Mango Pickle',
      slug: 'mango-pickle',
      description: 'Spicy mango pickle made with traditional spices',
      price: 250,
      stock: 30,
      images: ['https://example.com/mango-pickle.jpg'],
      categoryId: pickles.id
    },
    {
      name: 'Pure Cow Ghee',
      slug: 'pure-cow-ghee',
      description: '100% pure ghee made from cow milk',
      price: 600,
      discountPrice: 550,
      stock: 20,
      images: ['https://example.com/ghee.jpg'],
      categoryId: ghee.id
    }
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product
    })
  }

  // Create settings
  const settings = [
    { key: 'siteName', value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES' },
    { key: 'logo', value: 'https://example.com/logo.png' },
    { key: 'themeColor', value: '#ffd862' },
    { key: 'whatsappNumber', value: '919515019393' },
    { key: 'phone', value: '+91 9515019393' },
    { key: 'email', value: 'manidgs9393@gmail.com' },
    { key: 'address', value: '123 Main Street, City, State 123456' },
    { key: 'banners', value: JSON.stringify([
      { image: 'https://example.com/banner1.jpg', title: 'MANI DRY FRUITS STORES', description: 'Healthy products delivered to your doorstep' },
      { image: 'https://example.com/banner2.jpg', title: 'Fresh Dry Fruits', description: 'Direct from farms' }
    ]) },
    { key: 'seoTitle', value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES - Premium Quality Products' },
    { key: 'seoDescription', value: 'Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com' },
    { key: 'heroTitle', value: 'MANI DRY FRUITS, PICKLES AND GHEE STORES' },
    { key: 'heroSubtitle', value: 'Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com' },
    { key: 'featuredProducts', value: JSON.stringify(['prod1', 'prod2', 'prod3', 'prod4']) },
    { key: 'todaysOffers', value: JSON.stringify(['prod3', 'prod1', 'prod2', 'prod4']) }
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
      password: '$2b$10$dummy.hash.for.admin' // In real, hash properly
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