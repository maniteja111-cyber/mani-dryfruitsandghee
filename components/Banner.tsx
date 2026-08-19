'use client'

import Image from 'next/image'

interface Banner {
  image: string
  title?: string
  description?: string
}

interface BannerProps {
  banners: Banner[]
}

export default function Banner({ banners }: BannerProps) {
  const activeBanners = (banners || []).filter((b) => b && b.image)

  if (activeBanners.length === 0) {
    return (
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gray-100" />
    )
  }

  return (
    <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden">
      {activeBanners.map((banner, index) => (
        <div key={index} className="absolute inset-0">
          <Image
            src={banner.image}
            alt={banner.title || 'Banner'}
            fill
            sizes="100vw"
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  )
}