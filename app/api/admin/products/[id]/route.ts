import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { name, slug, description, shortDescription, pricePerKg, stockGrams, images, categoryId, isFeatured, isTodayOffer, isVisible, productOverview, whyChoose, ingredients, nutritionalInfo, storageInstructions, shelfLife, origin, benefits, shippingInfo, faqs, seoKeywords } = await req.json()

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    let cleanSlug = (slug || name || 'product')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (!cleanSlug) cleanSlug = `product-${Date.now()}`

    const cleanImages = (images || []).filter((img: string) => img && img.trim() !== '')

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: cleanSlug,
        description,
        shortDescription,
        stockGrams: Math.round(parseFloat(stockGrams)),
        pricePerKg: parseFloat(pricePerKg) || 0,
        images: JSON.stringify(cleanImages),
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
        faqs: faqs && faqs.length > 0 ? JSON.stringify(faqs) : null,
        seoKeywords: seoKeywords || null
      },
      include: { category: true }
    })

    revalidatePath('/')
    revalidatePath('/products')

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ])

    revalidatePath('/')
    revalidatePath('/products')

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}