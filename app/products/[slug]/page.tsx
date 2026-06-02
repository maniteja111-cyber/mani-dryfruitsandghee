import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
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
        title: `${product.name} - Mani Dry Fruits Stores`,
        description: product.description || `Buy ${product.name} online. Premium quality products.`,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }
  return {
    title: 'Product - Mani Dry Fruits Stores',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const { settings, product } = await getData(resolvedParams.slug)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail product={product} settings={settings} />
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '1234567890'} />
    </div>
  )
}