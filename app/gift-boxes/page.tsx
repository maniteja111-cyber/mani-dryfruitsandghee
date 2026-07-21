import ProductList from '@/components/ProductList'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { prisma } from '@/lib/prisma'

async function getData() {
  try {
    const [settings, giftBoxes] = await Promise.all([
      prisma.setting.findMany(),
      prisma.giftBox.findMany({
        where: { isActive: true },
        include: {
          eligibleProducts: {
            include: { product: true },
            orderBy: { sortOrder: 'asc' }
          },
          _count: { select: { orders: true } }
        },
        orderBy: { sortOrder: 'asc' }
      })
    ])

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return { settings: settingsObj, giftBoxes }
  } catch (error) {
    console.error('Error fetching gift boxes:', error)
    return { settings: {}, giftBoxes: [] }
  }
}

export const metadata = {
  title: 'Build Your Own Premium Gift Box - Mani Dry Fruits & Ghee',
  description: 'Create your custom premium dry fruit gift box. Handpick your favourite dry fruits and create your own premium hamper.',
}

export default async function GiftBoxesPage() {
  const { settings, giftBoxes } = await getData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Build Your Own Premium Gift Box
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Handpick your favourite dry fruits and create your own premium hamper. 
            Every selection is carefully curated for the perfect gifting experience.
          </p>
        </div>

        {giftBoxes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No gift boxes available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {giftBoxes.map(giftBox => {
              const finalPrice = giftBox.fixedPrice
              const savings = giftBox.originalPrice ? giftBox.originalPrice - finalPrice : 0

              return (
                <div key={giftBox.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {giftBox.heroImage && (
                    <img
                      src={giftBox.heroImage}
                      alt={giftBox.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Custom
                      </span>
                      {giftBox.isFeatured && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{giftBox.name}</h2>
                    {giftBox.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{giftBox.description}</p>
                    )}
                    
                    <div className="border-t border-b border-gray-100 py-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Fixed Price</span>
                        <span className="font-bold text-lg">Rs.{finalPrice}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 line-through">Rs.{giftBox.originalPrice}</span>
                          <span className="text-green-600 font-semibold">Save Rs.{savings}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Choose from:</p>
                      <p className="text-sm font-medium text-gray-700">
                        {giftBox.eligibleProducts.length} premium products
                      </p>
                    </div>

                    <a
                      href={`/gift-boxes/${giftBox.slug}/build`}
                      className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-yellow-700 transition"
                    >
                      Build Your Box
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '9515019393'} />
      <RewardsButton phone={settings.whatsappNumber || '9515019393'} />
    </div>
  )
}