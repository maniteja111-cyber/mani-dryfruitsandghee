import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import ProductDetail from '@/components/ProductDetail'
import { prisma } from '@/lib/prisma'

async function getData(slug: string) {
  try {
    const [settings, product] = await Promise.all([
      prisma.setting.findMany(),
      prisma.product.findUnique({
        where: { slug },
        include: { category: true }
      })
    ])

    if (!product) {
      notFound()
    }

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return { settings: settingsObj, product }
  } catch (error) {
    console.error('Error fetching product data:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  try {
    const product = await prisma.product.findUnique({
      where: { slug: resolvedParams.slug },
      include: { category: true }
    })
    if (product) {
      return {
        title: `${product.name} - Buy Online | MANI DRY FRUITS, PICKLES AND GHEE STORES`,
        description: product.description || `Buy ${product.name} online at best price. Premium quality ${product.category.name.toLowerCase()}. Fast delivery across India.`,
        keywords: `${product.name}, ${product.category.name}, dry fruits, ghee, pickle, buy online, manidryfruitsandghee`,
        alternates: {
          canonical: `https://manidryfruitsandghee.in/products/${product.slug}`
        }
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }
  return {
    title: 'Product - MANI DRY FRUITS, PICKLES AND GHEE STORES',
    description: 'Buy premium dry fruits, ghee, and pickles online',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const { settings, product } = await getData(resolvedParams.slug)

  const productImages = Array.isArray(product.images) ? product.images : []
  const price = product.discountPrice || product.price
  const ldJson = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: productImages,
    description: product.description || `${product.name} - Premium quality`,
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES'
    },
    offers: {
      '@type': 'Offer',
      url: `https://manidryfruitsandghee.in/products/${product.slug}`,
      priceCurrency: 'INR',
      price: price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES'
      }
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />
      <div className="min-h-screen bg-gray-50">
        <Header settings={settings} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductDetail product={product} settings={settings} />
        </main>
<Footer settings={settings} />
        <WhatsAppButton phone={settings.whatsappNumber || '1234567890'} />
        <RewardsButton phone={settings.whatsappNumber || '1234567890'} />
      </div>
    </>
  )
}