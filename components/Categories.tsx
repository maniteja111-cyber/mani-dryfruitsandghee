import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  image?: string | null
  description?: string | null
}

interface CategoriesProps {
  categories: Category[]
}

export default function Categories({ categories }: CategoriesProps) {
  const categoryEmojis: Record<string, string> = {
    'Dry Fruits': '🥜',
    'Pickles': '🫙',
    'Ghee': '🫙',
    'Powders': '🌶️'
  }

  const displayCategories = categories.length > 0 ? categories : [
    { id: '1', name: 'Dry Fruits', slug: 'dry-fruits', image: '', description: 'Premium quality dry fruits' },
    { id: '2', name: 'Ghee', slug: 'ghee', image: '', description: 'Pure cow ghee' },
    { id: '3', name: 'Pickles', slug: 'pickles', image: '', description: 'Authentic Indian pickles' },
    { id: '4', name: 'Powders', slug: 'powders', image: '', description: 'Spice powders' }
  ]

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {displayCategories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="group"
            >
              <div className="bg-white shadow rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                {category.image && category.image !== '' ? (
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-4xl mb-4">{categoryEmojis[category.name] || '🥜'}</div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}