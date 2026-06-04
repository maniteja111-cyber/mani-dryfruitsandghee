import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Banner from '@/components/Banner'
import Categories from '@/components/Categories'
import FeaturedProducts from '@/components/FeaturedProducts'
import TodaysOffers from '@/components/TodaysOffers'
import WhyChooseUs from '@/components/WhyChooseUs'
import Testimonials from '@/components/Testimonials'
import TopReviews from '@/components/TopReviews'
import WhatsAppButton from '@/components/WhatsAppButton'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'MANI DRY FRUITS, PICKLES AND GHEE STORES - Premium Quality Products',
  description: 'Shop for premium dry fruits, authentic pickles, and pure ghee. Fast delivery across India. Buy almonds, cashews, dates, ghee online at best prices.',
  keywords: 'dry fruits, ghee, pickle, buy online, premium quality, organic, manidryfruitsandghee, Mani Dry Fruits Stores',
  openGraph: {
    title: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    description: 'Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com',
    type: 'website'
  }
}

async function getHomeData() {
  try {
    const [settingsData, categories, allProducts, topReviews] = await Promise.all([
      prisma.setting.findMany(),
      prisma.category.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } }),
prisma.review.findMany({
         where: { approved: true },
         orderBy: { createdAt: 'desc' },
         take: 3,
         include: { product: { select: { name: true, slug: true } } }
       })
    ])

    const settingsObj = settingsData.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    // Parse featured and offers
    let featuredIds = []
    let offerIds = []
    try {
      featuredIds = settingsObj.featuredProducts ? JSON.parse(settingsObj.featuredProducts) : []
    } catch {}
    try {
      offerIds = settingsObj.todaysOffers ? JSON.parse(settingsObj.todaysOffers) : []
    } catch {}

    // Default to first 4 products if not configured
    if (featuredIds.length === 0) {
      featuredIds = allProducts.slice(0, 4).map(p => p.id)
    }
    if (offerIds.length === 0) {
      offerIds = allProducts.slice(0, 4).map(p => p.id)
    }

    const featuredProducts = allProducts.filter(p => featuredIds.includes(p.id))
    const todaysOffers = allProducts.filter(p => offerIds.includes(p.id))

    return { settings: settingsObj, categories, featuredProducts, todaysOffers, topReviews }
  } catch (error) {
    console.error('Error fetching home data:', error)
    return { settings: {}, categories: [], featuredProducts: [], todaysOffers: [], topReviews: [] }
  }
}

export default async function Home() {
  const { settings, categories, featuredProducts, todaysOffers, topReviews } = await getHomeData()

  let banners: any[] = []
  try {
    banners = settings.banners ? JSON.parse(settings.banners) : []
  } catch (error) {
    console.error('Error parsing banners JSON:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main>
        <Banner banners={banners} />
        <Hero title={settings.heroTitle || 'MANI DRY FRUITS, PICKLES AND GHEE STORES'} subtitle={settings.heroSubtitle || 'Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com'} />
        <Categories categories={categories} />
        <FeaturedProducts products={featuredProducts} title="⭐ Featured Products" settings={settings} />
        <TodaysOffers products={todaysOffers} />
        <TopReviews reviews={topReviews} />
        <WhyChooseUs />
        <Testimonials />
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '1234567890'} />
    </div>
  )
}
