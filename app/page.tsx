import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import FeaturedProducts from '@/components/FeaturedProducts'
import TodaysOffers from '@/components/TodaysOffers'
import WhyChooseUs from '@/components/WhyChooseUs'
import Testimonials from '@/components/Testimonials'
import TopReviews from '@/components/TopReviews'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/schema'
import { PricingService, getSelectorLabel, getUnitSymbol } from '@/app/services/pricing.service'
import { getNormalizedVariants, NormalizedVariant } from '@/app/services/variant.service'

interface Product {
  id: string
  name: string
  slug: string
  pricePerKg: number | null
  stockGrams: number
  images: any
  category?: { name: string }
  extension?: {
    stockQuantity: number | null
    basePrice?: number
    masterUnit?: { type: string | null }
  } | null
  variantPrices?: NormalizedVariant[]
  productType: string | null
  unitSymbol: string
}

async function enrichProducts(products: any[]): Promise<Product[]> {
  return Promise.all(products.map(async (product) => {
    const ext = await prisma.productExtension.findUnique({
      where: { productId: product.id },
      include: { masterUnit: true }
    })
    
    const variants = await prisma.productProductVariant.findMany({
      where: { productId: product.id, isActive: true },
      select: { variantId: true }
    })
    
    const productType = ext?.masterUnit?.type || 'weight'
    const basePrice = ext?.basePrice ?? product.pricePerKg ?? 0
    const templateId: string | null = ext?.pricingTemplateId ?? null
    
    const prices = (basePrice > 0 && variants.length > 0)
      ? await PricingService.generateVariantPrices(
          product.id,
          basePrice,
          templateId,
          variants.map(v => v.variantId)
        )
      : []
    
    const normalizedVariants = getNormalizedVariants(prices)
    
return {
      ...product,
      extension: ext,
      productVariants: variants,
      variantPrices: normalizedVariants,
      productType,
      unitSymbol: getUnitSymbol(productType),
      selectorLabel: getSelectorLabel(productType)
    }
  }))
}

async function getHomeData() {
  try {
    const [settingsData, categories, featuredProductsRaw, todaysOffersRaw, topReviews] = await Promise.all([
      prisma.setting.findMany(),
      prisma.category.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.product.findMany({ where: { isFeatured: true }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
      prisma.product.findMany({ where: { isTodayOffer: true }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
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

    const featuredProducts = await enrichProducts(featuredProductsRaw)
    const todaysOffers = await enrichProducts(todaysOffersRaw)

    return { settings: settingsObj, categories, featuredProducts, todaysOffers, topReviews }
  } catch (error) {
    console.error('Error fetching home data:', error)
    return { settings: {}, categories: [], featuredProducts: [], todaysOffers: [], topReviews: [] }
  }
}

export const revalidate = 0

export default async function Home() {
  const { settings, categories, featuredProducts, todaysOffers, topReviews } = await getHomeData()

  const organizationSchema = generateOrganizationSchema({
    name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    url: 'https://manidryfruitsandghee.in',
    logo: settings.logo || 'https://manidryfruitsandghee.in/logo.png',
    phone: settings.whatsappNumber,
    address: settings.address
  })

  const websiteSchema = generateWebsiteSchema({
    name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    url: 'https://manidryfruitsandghee.in'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <Header settings={settings} />
      <main>
        <Hero title={settings.heroTitle || 'MANI DRY FRUITS, PICKLES AND GHEE STORES ABROAD PICKLES PACKING'} subtitle={settings.heroSubtitle || 'Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com'} />
        <Categories categories={categories} />
        <FeaturedProducts products={featuredProducts} title="⭐ Featured Products" settings={settings} />
        <TodaysOffers products={todaysOffers} />
        <TopReviews reviews={topReviews} />
        <WhyChooseUs />
        <Testimonials />
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '9515019393'} />
      <RewardsButton phone={settings.whatsappNumber || '9515019393'} />
    </div>
  )
}
