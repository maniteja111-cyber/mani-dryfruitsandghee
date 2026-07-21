import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.pathname.split('/').pop()

    const giftBox = await prisma.giftBox.findUnique({
      where: { slug },
      include: {
        eligibleProducts: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' }
        },
        rules: true
      }
    })

    if (!giftBox) {
      return NextResponse.json({ error: 'Gift box not found' }, { status: 404 })
    }

    return NextResponse.json(giftBox)
  } catch (error) {
    console.error('Get gift box error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const slug = req.nextUrl.pathname.split('/').pop()
    const body = await req.json()

    const existing = await prisma.giftBox.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: 'Gift box not found' }, { status: 404 })
    }

    const {
      name,
      description,
      heroImage,
      thumbnail,
      gallery,
      seoTitle,
      seoDescription,
      seoKeywords,
      metaImage,
      ogTitle,
      ogDescription,
      ogImage,
      fixedPrice,
      originalPrice,
      discount,
      offerPrice,
      gstRate,
      packagingCharge,
      deliveryCharge,
      isActive,
      isFeatured,
      isTodayOffer,
      sortOrder,
      startDate,
      endDate,
      maxOrdersPerCustomer,
      eligibleProductIds,
      rules
    } = body

    await prisma.giftBoxEligibleProduct.deleteMany({ where: { giftBoxId: existing.id } })
    await prisma.giftBoxRule.deleteMany({ where: { giftBoxId: existing.id } })

    const giftBox = await prisma.giftBox.update({
      where: { id: existing.id },
      data: {
        name,
        description,
        heroImage,
        thumbnail,
        gallery,
        seoTitle,
        seoDescription,
        seoKeywords,
        metaImage,
        ogTitle,
        ogDescription,
        ogImage,
        fixedPrice,
        originalPrice,
        discount,
        offerPrice,
        gstRate,
        packagingCharge,
        deliveryCharge,
        isActive,
        isFeatured,
        isTodayOffer,
        sortOrder: sortOrder || 0,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        maxOrdersPerCustomer: maxOrdersPerCustomer || 0,
        eligibleProducts: eligibleProductIds && eligibleProductIds.length > 0
          ? {
              create: eligibleProductIds.map((id: string, index: number) => ({
                productId: id,
                sortOrder: index
              }))
            }
          : undefined,
        rules: rules && rules.length > 0
          ? {
              create: rules.map((rule: any) => ({
                conditionType: rule.conditionType,
                conditionValue: rule.conditionValue,
                actionType: rule.actionType,
                actionValue: rule.actionValue,
                sortOrder: rule.sortOrder
              }))
            }
          : undefined
      }
    })

    return NextResponse.json(giftBox)
  } catch (error) {
    console.error('Update gift box error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const slug = req.nextUrl.pathname.split('/').pop()

    const existing = await prisma.giftBox.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: 'Gift box not found' }, { status: 404 })
    }

    await prisma.giftBox.delete({ where: { id: existing.id } })

    return NextResponse.json({ message: 'Gift box deleted' })
  } catch (error) {
    console.error('Delete gift box error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}