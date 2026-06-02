export default function WhyChooseUs() {
  const features = [
    {
      icon: '🚚',
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery across India'
    },
    {
      icon: '🌿',
      title: 'Fresh Quality',
      description: 'Premium quality products sourced fresh'
    },
    {
      icon: '💯',
      title: 'Trusted Products',
      description: 'Authentic and genuine products you can trust'
    },
    {
      icon: '📞',
      title: 'Quick Support',
      description: '24/7 customer support for your needs'
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-6xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}