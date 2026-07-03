import ProductList from '@/components/ProductList'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

async function getData(slug: string) {
  try {
    const [settings, category, categories] = await Promise.all([
      prisma.setting.findMany(),
      prisma.category.findUnique({ where: { slug } }),
      prisma.category.findMany({ orderBy: { createdAt: 'desc' } })
    ])

    const products = category
      ? await prisma.product.findMany({
          where: { categoryId: category.id },
          include: { category: true },
          orderBy: { createdAt: 'desc' }
        })
      : []

    if (!category) return { settings: {}, category: null, categories: [], products: [] }

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return { settings: settingsObj, category, categories, products }
  } catch (error) {
    console.error('Error fetching category data:', error)
    return { settings: {}, category: null, categories: [], products: [] }
  }
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const { category } = await getData(slug)
  if (!category) return { title: 'Category Not Found' }
  return {
    title: `${category.name} - Mani Dry Fruits & Ghee Store`,
    description: category.description || `Shop ${category.name} at Mani Dry Fruits & Ghee Store. Premium quality.`,
    alternates: { canonical: `https://manidryfruitsandghee.in/categories/${category.slug}` }
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const { settings, category, categories, products } = await getData(slug)

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
        <ProductList
          initialProducts={products}
          categories={categories}
          searchParams={{ category: category.id }}
          settings={settings}
        />
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '9515019393'} />
      <RewardsButton phone={settings.whatsappNumber || '9515019393'} />
    </div>
  )
}