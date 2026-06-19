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
    const [settings, product, relatedProducts, recentProducts] = await Promise.all([
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
      }),
      prisma.product.findMany({
        where: { isVisible: true },
        take: 4,
        orderBy: { createdAt: 'desc' }
      })
    ])

    if (!product) {
      notFound()
    }

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return { settings: settingsObj, product, relatedProducts, recentProducts }
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
  const { settings, product, relatedProducts, recentProducts } = await getData(resolvedParams.slug)

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

  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'ReviewAction',
    'itemReviewed': productSchema,
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': avgRating,
      'bestRating': '5'
    }
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

          <ProductDetail product={product} settings={settings} />

          <div className="mt-12 bg-white rounded-lg shadow p-6 space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
              <p className="text-gray-600">{product.description || product.shortDescription || `${product.name} - Premium quality ${categoryName}.`}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Highlights</h2>
              <p className="text-gray-600">{product.productOverview || product.whyChoose || `Discover the authentic taste of ${product.name}, carefully prepared with premium ingredients.`}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <p className="text-gray-600">{product.ingredients || 'Premium natural ingredients.'}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nutritional Information</h2>
              <p className="text-gray-600">{product.nutritionalInfo || 'Rich in essential nutrients and natural goodness.'}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Storage Instructions</h2>
              <p className="text-gray-600">{product.storageInstructions || 'Store in a cool, dry place.'}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Shelf Life</h2>
              <p className="text-gray-600">{product.shelfLife || '6-12 months when stored properly.'}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Origin</h2>
              <p className="text-gray-600">{product.origin || 'Authentic Indian origin.'}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits</h2>
              <p className="text-gray-600">{product.benefits || 'Provides essential nutrition and authentic flavor.'}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Information</h2>
              <p className="text-gray-600">{product.shippingInfo || 'Fast delivery across India with safe packaging.'}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Specifications</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-200">
                    <tr><td className="py-2 font-medium">Weight</td><td className="py-2">{product.variants && Array.isArray(product.variants) && (product.variants[0] as {size?: string})?.size ? (product.variants[0] as {size?: string}).size : 'See variant options'}</td></tr>
                    <tr><td className="py-2 font-medium">Ingredients</td><td className="py-2">{product.ingredients || 'Premium ingredients'}</td></tr>
                    <tr><td className="py-2 font-medium">Shelf Life</td><td className="py-2">{product.shelfLife || '6-12 months'}</td></tr>
                    <tr><td className="py-2 font-medium">Storage</td><td className="py-2">{product.storageInstructions || 'Cool, dry place'}</td></tr>
                    <tr><td className="py-2 font-medium">Origin</td><td className="py-2">{product.origin || 'India'}</td></tr>
                    <tr><td className="py-2 font-medium">Brand</td><td className="py-2">MANI DRY FRUITS & GHEE STORES</td></tr>
                    <tr><td className="py-2 font-medium">Category</td><td className="py-2">{categoryName}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Trust & Quality</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded"><span className="block text-2xl mb-1">📦</span><span className="text-sm">Freshly Packed</span></div>
                <div className="p-3 bg-gray-50 rounded"><span className="block text-2xl mb-1">💳</span><span className="text-sm">Secure Payment</span></div>
                <div className="p-3 bg-gray-50 rounded"><span className="block text-2xl mb-1">🚚</span><span className="text-sm">Fast Delivery</span></div>
                <div className="p-3 bg-gray-50 rounded"><span className="block text-2xl mb-1">✅</span><span className="text-sm">Quality Checked</span></div>
                <div className="p-3 bg-gray-50 rounded"><span className="block text-2xl mb-1">🌿</span><span className="text-sm">Premium Ingredients</span></div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 ? (
                  (product.faqs as {question: string, answer: string}[]).map((faq, idx: number) => (
                    <div key={idx}>
                      <p className="font-semibold">{faq.question}</p>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No FAQs available for this product.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews ({reviews.length})</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.name}</span>
                        <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                      </div>
                      <p className="text-gray-700 mt-1">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Be the first to review this product.</p>
              )}
            </section>

            {relatedProducts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Related Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((p) => {
                    const imgSrc = Array.isArray(p.images) && p.images[0] ? String(p.images[0]) : ''
                    return (
                      <Link key={p.id} href={`/products/${p.slug}`} className="bg-gray-50 rounded-lg p-3 text-center hover:shadow-md transition">
                        {imgSrc && <img src={imgSrc} alt={p.name} className="w-full h-20 object-cover rounded mb-2" />}
                        {!imgSrc && <div className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-500 text-xs">No Image</div>}
                        <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                        <p className="text-yellow-600 font-bold text-sm">₹{p.discountPrice || p.price}</p>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {recentProducts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recently Viewed Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recentProducts.map((p) => {
                    const imgSrc = Array.isArray(p.images) && p.images[0] ? String(p.images[0]) : ''
                    return (
                      <Link key={p.id} href={`/products/${p.slug}`} className="bg-gray-50 rounded-lg p-3 text-center hover:shadow-md transition">
                        {imgSrc && <img src={imgSrc} alt={p.name} className="w-full h-20 object-cover rounded mb-2" />}
                        {!imgSrc && <div className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-500 text-xs">No Image</div>}
                        <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </main>
        <Footer settings={settings} />
        <WhatsAppButton phone={settings.whatsappNumber || '9515019393'} />
        <RewardsButton phone={settings.whatsappNumber || '9515019393'} />
      </div>
    </>
  )
}