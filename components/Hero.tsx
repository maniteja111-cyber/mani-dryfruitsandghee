import Link from 'next/link'

interface HeroProps {
  title: string
  subtitle: string
}

export default function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
        <p className="text-xl md:text-2xl mb-8">{subtitle}</p>
        <Link
          href="/products"
          className="inline-block bg-white text-yellow-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Shop Now
        </Link>
      </div>
    </section>
  )
}