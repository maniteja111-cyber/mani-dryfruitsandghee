import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/login', '/cart', '/checkout', '/account', '/my-orders', '/wishlist']
      }
    ],
    sitemap: [
      'https://manidryfruitsandghee.in/sitemap.xml',
      'https://manidryfruitsandghee.in/api/google-feed'
    ]
  }
}