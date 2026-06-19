import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import ProductDetail from '@/components/ProductDetail'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getData(slug: string) {
  try {
    const [settings, product, relatedProducts] = await Promise.all([
      prisma.setting.findMany(),
      prisma.product.findUnique({
        where: { slug },
        include: { category: true }
      }),
      prisma.product.findMany({
        where: { 
          categoryId: (await prisma.product.findUnique({where: { slug }, include: { category: true }}))?.categoryId,
          NOT: { slug }
        },
        take: 4
      })
    ])

    if (!product) {
      notFound()
    }

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
      return {
        title: `${product.name} - Buy Online | MANI DRY FRUITS & GHEE STORES`,
        description: product.description || product.shortDescription || `Buy ${product.name} online at best price. Premium quality ${product.category.name.toLowerCase()}. Fast delivery across India.`,
        keywords,
        alternates: {
          canonical: `https://manidryfruitsandghee.in/products/${product.slug}`
        },
        openGraph: {
          title: `${product.name} - MANI DRY FRUITS & GHEE STORES`,
          description: product.description || product.shortDescription || `Premium ${product.category.name.toLowerCase()} online`,
          images: Array.isArray(product.images) && product.images[0] ? [String(product.images[0])] : [],
          url: `https://manidryfruitsandghee.in/products/${product.slug}`
        },
        twitter: {
          title: `${product.name}`,
          description: product.description || product.shortDescription || `Buy online`,
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
  const price = product.discountPrice || product.price
  const categoryName = product.category?.name || 'Product'
  const reviews = await prisma.review.findMany({
    where: { productId: product.id, approved: true },
    orderBy: { createdAt: 'desc' }
  })
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.5'

  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: productImages,
    description: product.description || product.shortDescription || `${product.name} - Premium quality`,
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES'
    },
    category: categoryName,
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
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: 'INR'
      },
      deliveryTime: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '21:00'
      }
    },
    returnPolicy: '30-day money back guarantee'
  }

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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://manidryfruitsandghee.in/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Products', 'item': 'https://manidryfruitsandghee.in/products' },
      { '@type': 'ListItem', 'position': 3, 'name': categoryName, 'item': `https://manidryfruitsandghee.in/products?category=${product.categoryId}` },
      { '@type': 'ListItem', 'position': 4, 'name': product.name, 'item': `https://manidryfruitsandghee.in/products/${product.slug}` }
    ]
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    'url': 'https://manidryfruitsandghee.in',
    'logo': 'https://manidryfruitsandghee.in/logo.png'
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
    'image': productImages[0] ? [productImages[0]] : [],
    'url': 'https://manidryfruitsandghee.in',
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'IN'
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': settings.whatsappNumber || '',
      'contactType': 'customer service'
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': faqSchema }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'AggregateRating', 'itemReviewed': productSchema, 'ratingValue': avgRating, 'reviewCount': reviews.length }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      
      <div className="min-h-screen bg-gray-50">
        <Header settings={settings} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-yellow-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-yellow-600">Products</Link>
            <span className="mx-2">/</span>
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