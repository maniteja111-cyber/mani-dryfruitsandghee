import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import ProductDetail from '@/components/ProductDetail'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateAggregateRatingSchema,
  generateFAQSchema,
  generateLocalBusinessSchema
} from '@/lib/schema'

async function getData(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true }
    })

    if (!product) {
      notFound()
    }

    let relatedProducts = await prisma.product.findMany({
      where: { 
        categoryId: product.categoryId,
        NOT: { slug }
      },
      take: 4
    })

    if (relatedProducts.length === 0) {
      relatedProducts = await prisma.product.findMany({
        where: { 
          NOT: { slug }
        },
        take: 4
      })
    }

    const settings = await prisma.setting.findMany()
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return { settings: settingsObj, product, relatedProducts }
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
      const keywords = `${product.name}, ${product.category.name}, buy ${product.name.toLowerCase()} online india, authentic ${product.category.name.toLowerCase()}, premium quality, manidryfruitsandghee`
      const description = product.description || product.shortDescription || `Buy ${product.name} online at best price. Premium quality ${product.category.name.toLowerCase()}. Fast delivery across India.`
      return {
        title: `Buy ${product.name} Online | Mani Dry Fruits`,
        description,
        keywords,
        alternates: {
          canonical: `https://manidryfruitsandghee.in/products/${product.slug}`
        },
        openGraph: {
          title: `${product.name} - Mani Dry Fruits & Ghee Store`,
          description,
          images: Array.isArray(product.images) && product.images[0] ? [String(product.images[0])] : [],
          url: `https://manidryfruitsandghee.in/products/${product.slug}`
        },
        twitter: {
          title: `${product.name}`,
          description,
          card: 'summary_large_image'
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
  const { settings, product, relatedProducts } = await getData(resolvedParams.slug)

  const productImages = Array.isArray(product.images) ? product.images.map(String) : []
  const price = product.pricePerKg || 0
  const categoryName = product.category?.name || 'Product'
  const stockGrams = product.stockGrams
  const inStock = product.stockGrams > 0
  const reviews = await prisma.review.findMany({
    where: { productId: product.id, approved: true },
    orderBy: { createdAt: 'desc' }
  })
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.5'

  const productSchema = generateProductSchema({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || product.shortDescription || `${product.name} - Premium quality`,
    images: productImages,
    sku: product.slug,
    brand: 'Mani Dry Fruits & Ghee',
    category: categoryName,
    price: price,
    currency: 'INR',
    availability: inStock ? 'InStock' : 'OutOfStock',
    url: `https://manidryfruitsandghee.in/products/${product.slug}`,
    reviewCount: reviews.length,
    averageRating: parseFloat(avgRating),
    seller: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    mpn: `MDF-${product.slug}`
  })

  const faqSchema = product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 
    ? (product.faqs as {question: string, answer: string}[]).map((q) => ({
        '@type': 'Question',
        'name': q.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': q.answer
        }
      }))
    : [
    {
      '@type': 'Question',
      'name': `Is ${product.name} available for delivery across India?`,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': `${product.name} is available for delivery across all major cities in India.`
      }
    },
    {
      '@type': 'Question',
      'name': `How should I store ${product.name}?`,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': `Store in a cool, dry place away from direct sunlight.`
      }
    }
  ]

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://manidryfruitsandghee.in/' },
    { name: 'Products', url: 'https://manidryfruitsandghee.in/products' },
    { name: categoryName, url: `https://manidryfruitsandghee.in/products?category=${product.categoryId}` },
    { name: product.name, url: `https://manidryfruitsandghee.in/products/${product.slug}` }
  ])

  const organizationSchema = generateOrganizationSchema({
    name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    url: 'https://manidryfruitsandghee.in',
    logo: settings.logo || 'https://manidryfruitsandghee.in/logo.png'
  })

  const websiteSchema = generateWebsiteSchema({
    name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    url: 'https://manidryfruitsandghee.in'
  })

  const localBusinessSchema = generateLocalBusinessSchema({
    name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    url: 'https://manidryfruitsandghee.in',
    images: productImages,
    phone: settings.whatsappNumber,
    address: settings.address
  })

  const aggregateRatingSchema = reviews.length > 0
    ? generateAggregateRatingSchema(
        `https://manidryfruitsandghee.in/products/${product.slug}`,
        parseFloat(avgRating),
        reviews.length
      )
    : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': faqSchema }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {aggregateRatingSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      
      <div suppressHydrationWarning className="min-h-screen bg-gray-50">
        <Header settings={settings} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-yellow-600">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-yellow-600">Products</Link>
            <span>/</span>
            <span className="text-gray-700">{product.name}</span>
          </nav>

          <ProductDetail product={product} settings={settings} relatedProducts={relatedProducts} />
        </main>
        <Footer settings={settings} />
        <WhatsAppButton phone={settings.whatsappNumber || '9515019393'} />
        <RewardsButton phone={settings.whatsappNumber || '9515019393'} />
      </div>
    </>
  )
}