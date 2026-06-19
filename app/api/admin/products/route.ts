import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, description, shortDescription, price, discountPrice, stock, images, categoryId, variants, measurementType, isFeatured, isTodayOffer, isVisible, productOverview, whyChoose, ingredients, nutritionalInfo, storageInstructions, shelfLife, origin, benefits, shippingInfo, faqs, seoKeywords } = await req.json()

    let cleanSlug = (slug || name || 'product')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (!cleanSlug) cleanSlug = `product-${Date.now()}`

    const product = await prisma.product.create({
      data: {
        name,
        slug: cleanSlug,
        description,
        shortDescription,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock),
        measurementType: measurementType || 'quantity',
        images: JSON.stringify(images || []),
        variants: variants || null,
        categoryId,
        isFeatured: isFeatured || false,
        isTodayOffer: isTodayOffer || false,
        isVisible: isVisible !== false,
        productOverview: productOverview || null,
        whyChoose: whyChoose || null,
        ingredients: ingredients || null,
        nutritionalInfo: nutritionalInfo || null,
        storageInstructions: storageInstructions || null,
        shelfLife: shelfLife || null,
        origin: origin || null,
        benefits: benefits || null,
        shippingInfo: shippingInfo || null,
        faqs: faqs || null,
        seoKeywords: seoKeywords || null
      },
      include: { category: true }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}