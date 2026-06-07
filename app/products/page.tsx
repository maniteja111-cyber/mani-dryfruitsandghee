import ProductList from '@/components/ProductList'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RewardsButton from '@/components/RewardsButton'
import { prisma } from '@/lib/prisma'

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

    return { settings: settingsObj, categories, products }
  } catch (error) {
    console.error('Error fetching products data:', error)
    return { settings: {}, categories: [], products: [] }
  }
}

interface ProductsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export const metadata = {
  title: 'Products - MANI DRY FRUITS, PICKLES AND GHEE STORES',
  description: 'Browse our collection of premium dry fruits, pickles, and ghee. High quality products with fast delivery.',
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { settings, categories, products } = await getData(searchParams)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Products</h1>
        <ProductList
          initialProducts={products}
          categories={categories}
          searchParams={searchParams}
          settings={settings}
        />
      </main>
      <Footer settings={settings} />
      <RewardsButton phone={settings.whatsappNumber || '1234567890'} />
    </div>
  )
}