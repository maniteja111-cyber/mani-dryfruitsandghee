import ProductList from '@/components/ProductList'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

async function getData(slug: string) {
  try {
    const [settings, category, products] = await Promise.all([
      prisma.setting.findMany(),
      prisma.category.findUnique({ where: { slug } }),
      prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      })
    ])

    if (!category) return { settings: {}, category: null, products: [] }

    const categoryData = category
    const filteredProducts = products.filter(p => p.categoryId === category.id)

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return { settings: settingsObj, category: categoryData, products: filteredProducts }
  } catch (error) {
    console.error('Error fetching category data:', error)
    return { settings: {}, category: null, products: [] }
  }
}

interface CategoryPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await getData(params.slug)
  if (!category) return { title: 'Category Not Found' }
  return {
    title: `${category.name} - Mani Dry Fruits & Ghee Store`,
    description: category.description || `Shop ${category.name} at Mani Dry Fruits & Ghee Store. Premium quality.`,
    alternates: { canonical: `https://manidryfruitsandghee.in/categories/${category.slug}` }
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { settings, category, products } = await getData(params.slug)

  if (!category) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mt-2">{category.description}</p>
          )}
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} className="w-full h-40 object-cover rounded-md mb-3" />
                <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                <p className="text-orange-600 font-bold mt-2">₹{product.pricePerKg}/kg</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No products in this category yet.</p>
        )}
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '9515019393'} />
      <RewardsButton phone={settings.whatsappNumber || '9515019393'} />
    </div>
  )
}