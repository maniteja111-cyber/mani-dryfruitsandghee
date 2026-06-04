import Image from 'next/image'

interface Banner {
  image: string
  title: string
  description?: string
}

interface BannerProps {
  banners: Banner[]
}

export default function Banner({ banners }: BannerProps) {
  if (!banners || banners.length === 0) {
    return (
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-64 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">MANI DRY FRUITS, PICKLES AND GHEE STORES</h1>
          <p className="text-xl">Healthy products delivered to your doorstep. Contact: +91 9515019393</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      <div className="flex">
        {banners.map((banner, index) => (
          <div key={index} className="min-w-full relative">
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">{banner.title}</h1>
                {banner.description && (
                  <p className="text-lg md:text-xl">{banner.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}