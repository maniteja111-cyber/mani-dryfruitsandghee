import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isVisible: true },
      include: { category: true }
    })

    const formatPrice = (price: number | null) => {
      return price ? `INR ${price.toFixed(2)}` : 'INR 0.00'
    }

    const generateMPN = (slug: string) => {
      return `MDF-${slug.toUpperCase()}`
    }

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Mani Dry Fruits &amp; Ghee Store</title>
    <link>https://manidryfruitsandghee.in</link>
    <description>Premium Dry Fruits, Pickles &amp; Ghee Store</description>
    ${products.map(product => {
      const images = Array.isArray(product.images) ? product.images : []
      const primaryImage = images[0] || 'https://manidryfruitsandghee.in/placeholder.svg'
      const availability = product.stockGrams > 0 ? 'available' : 'unavailable'
      const categoryName = product.category?.name || 'Product'
      
      return `
    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${product.description || product.shortDescription || product.name}]]></g:description>
      <g:link>https://manidryfruitsandghee.in/products/${product.slug}</g:link>
      <g:image_link>${primaryImage}</g:image_link>
      <g:price>${formatPrice(product.pricePerKg)}</g:price>
      <g:availability>${availability}</g:availability>
      <g:brand>Mani Dry Fruits &amp; Ghee</g:brand>
      <g:mpn>${generateMPN(product.slug)}</g:mpn>
      <g:sku>${product.slug}</g:sku>
      <g:category>${categoryName}</g:category>
      <g:condition>new</g:condition>
      <g:shipping>
        <g:service>Standard Shipping</g:service>
        <g:price>INR 50.00</g:price>
      </g:shipping>
      <g:shipping>
        <g:service>Free Shipping</g:service>
        <g:price>INR 0.00</g:price>
        <g:minimum_order_value>INR 999.00</g:minimum_order_value>
      </g:shipping>
      <g:return_policy>
        <g:days>30</g:days>
        <g:policy>30-day money back guarantee</g:policy>
      </g:return_policy>
    </item>`
    }).join('')}
  </channel>
</rss>`

    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Feed generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}