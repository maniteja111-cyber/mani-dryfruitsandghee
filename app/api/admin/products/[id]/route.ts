import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { name, slug, description, price, discountPrice, stock, images, categoryId, variants, measurementType } = await req.json()

    let cleanSlug = (slug || name || 'product')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (!cleanSlug) cleanSlug = `product-${Date.now()}`

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: cleanSlug,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock),
        measurementType: measurementType || 'quantity',
        images: JSON.stringify(images || []),
        variants: variants || null,
        categoryId
      },
      include: { category: true }
    })

    revalidatePath('/')
    revalidatePath('/products')

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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