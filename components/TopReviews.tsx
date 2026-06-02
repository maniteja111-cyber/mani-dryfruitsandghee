import Link from 'next/link'

interface Review {
  id: string
  name: string
  rating: number
  comment: string
  product: { name: string; slug: string }
}

interface TopReviewsProps {
  reviews: Review[]
}

export default function TopReviews({ reviews }: TopReviewsProps) {
  const maskName = (name: string) => {
    if (name.length <= 2) return name
    return name.charAt(0) + '***' + name.charAt(name.length - 1)
  }

  if (!reviews || reviews.length === 0) return null

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <div className="text-yellow-500 text-lg">
                  {'⭐'.repeat(review.rating)}
                </div>
              </div>
              <p className="text-gray-700 mb-3">&quot;{review.comment}&quot;</p>
              <div className="border-t pt-3">
                <p className="font-semibold text-gray-900">{maskName(review.name)}</p>
<p className="text-sm text-gray-500">
                   Reviewed: <Link href={`/products/${review.product.slug}`} className="text-yellow-600 hover:underline">
                     {review.product.name}
                   </Link>
                 </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}