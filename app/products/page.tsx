import ProductList from '@/components/ProductList'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { prisma } from '@/lib/prisma'
import { PricingService, getSelectorLabel, getUnitSymbol } from '@/app/services/pricing.service'
import { getNormalizedVariants } from '@/app/services/variant.service'

async function enrichProducts(products: any[]): Promise<any[]> {
  return Promise.all(products.map(async (product) => {
    const ext = await prisma.productExtension.findUnique({
      where: { productId: product.id },
      include: { masterUnit: true }
    })
    
    const variants = await prisma.productProductVariant.findMany({
      where: { productId: product.id, isActive: true },
      select: { variantId: true }
    })
    
    const prices = ext?.basePrice && variants.length > 0
      ? await PricingService.generateVariantPrices(
          product.id,
          ext.basePrice,
          ext.pricingTemplateId,
          variants.map(v => v.variantId)
        )
      : []
    
    const normalizedVariants = getNormalizedVariants(prices)
    const productType = ext?.masterUnit?.type || (normalizedVariants[0]?.unitType) || null
    
    const hasStock = product.stockGrams > 0 || (ext?.stockQuantity ?? 0) > 0
    const basePrice = ext?.basePrice || product.pricePerKg || 0
    const unit = productType || 'weight'
    const unitLabels: Record<string, { symbol: string; plural: string }> = {
      weight: { symbol: '₹', plural: 'kg' },
      quantity: { symbol: '₹', plural: 'pieces' },
      pack: { symbol: '₹', plural: 'packs' },
      volume: { symbol: '₹', plural: 'litres' }
    }
    const unitInfo = unitLabels[unit] || unitLabels.weight
    const priceDisplay = `${unitInfo.symbol}${basePrice}/${unitInfo.plural}`
    const stockQuantity = ext?.stockQuantity ?? product.stockGrams ?? 0
    
    return {
      ...product,
      extension: ext,
      productVariants: variants,
      variantPrices: normalizedVariants,
      productType,
      unitSymbol: getUnitSymbol(productType),
      selectorLabel: getSelectorLabel(productType),
      hasStock,
      stockQuantity,
      priceDisplay
    }
  }))
}

async function getData(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const where: any = {}
    if (searchParams.category) {
      where.categoryId = searchParams.category as string
    }
    if (searchParams.search) {
      where.name = { contains: searchParams.search as string, mode: 'insensitive' }
    }

    const sort = (searchParams.sort as string) || 'createdAt'
    const order = (searchParams.order as string) === 'asc' ? 'asc' : 'desc'

    const [settings, categories, products] = await Promise.all([
      prisma.setting.findMany(),
      prisma.category.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [sort]: order }
      })
    ])

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    const enrichedProducts = await enrichProducts(products)

    return { settings: settingsObj, categories, products: enrichedProducts }
  } catch (error) {
    console.error('Error fetching products data:', error)
    return { settings: {}, categories: [], products: [] }
  }
}

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const { settings, categories, products } = await getData(params)

return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Products</h1>
        <ProductList
          initialProducts={products}
          categories={categories}
          searchParams={params}
          settings={settings}
        />
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '1234567890'} />
      <RewardsButton phone={settings.whatsappNumber || '1234567890'} />
    </div>
  )
}