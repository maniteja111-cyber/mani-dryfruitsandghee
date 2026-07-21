import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get('featured') === 'true'
    const active = searchParams.get('active') !== 'false'

    const where: any = {}
    if (active) {
      where.isActive = true
    }
    if (featured) {
      where.isFeatured = true
    }

    const giftBoxes = await prisma.giftBox.findMany({
      where,
      include: {
        eligibleProducts: {
          include: {
            product: true
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(giftBoxes)
  } catch (error) {
    console.error('Get gift boxes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      slug,
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

    const existing = await prisma.giftBox.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Gift box with this slug already exists' }, { status: 400 })
    }

    const giftBox = await prisma.giftBox.create({
      data: {
        name,
        slug,
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
                ruleType: rule.type,
                ruleValue: JSON.stringify(rule.value),
                description: rule.description
              }))
            }
          : undefined
      }
    })

    return NextResponse.json(giftBox)
  } catch (error) {
    console.error('Create gift box error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}