import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status

    const orders = await prisma.giftBoxOrder.findMany({
      where,
      include: {
        giftBox: {
          select: {
            name: true,
            slug: true,
            fixedPrice: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Get gift box orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      giftBoxId,
      userId,
      userName,
      userPhone,
      userEmail,
      items,
      address,
      city,
      state,
      pincode,
      notes,
      giftWrap,
      ribbonColor,
      greetingCard,
      giftMessage,
      theme,
      paymentMethod = 'cod'
    } = body

    const giftBox = await prisma.giftBox.findUnique({
      where: { id: giftBoxId },
      include: {
        eligibleProducts: {
          include: { product: true }
        }
      }
    })

    if (!giftBox) {
      return NextResponse.json({ error: 'Gift box not found' }, { status: 404 })
    }

    let totalWeight = 0
    let totalDeduct = 0

    for (const item of items) {
      const productId = item.productId
      const quantity = item.quantity
      const variantGrams = item.selectedVariant?.grams || 200

      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 400 })
      }

      const requiredGrams = variantGrams * quantity
      if (product.stockGrams < requiredGrams) {
        return NextResponse.json({
          error: `Not enough stock for ${product.name}. Available: ${product.stockGrams}g`
        }, { status: 400 })
      }

      totalWeight += requiredGrams
      totalDeduct += requiredGrams
    }

    const order = await prisma.giftBoxOrder.create({
      data: {
        giftBoxId,
        userId,
        userName,
        userPhone,
        userEmail,
        items: JSON.stringify(items),
        totalWeight,
        totalPrice: giftBox.fixedPrice,
        GST: (giftBox.fixedPrice * (giftBox.gstRate || 18)) / 100,
        packagingCharge: giftBox.packagingCharge || 0,
        deliveryCharge: giftBox.deliveryCharge || 0,
        finalTotal: giftBox.fixedPrice + ((giftBox.fixedPrice * (giftBox.gstRate || 18)) / 100) + (giftBox.packagingCharge || 0) + (giftBox.deliveryCharge || 0),
        address,
        city,
        state,
        pincode,
        notes,
        giftWrap: !!giftWrap,
        ribbonColor,
        greetingCard: !!greetingCard,
        giftMessage,
        theme,
        paymentMethod
      }
    })

    for (const item of items) {
      const productId = item.productId
      const variantGrams = item.selectedVariant?.grams || 200
      const quantity = item.quantity
      const deduction = variantGrams * quantity

      await prisma.product.update({
        where: { id: productId },
        data: {
          stockGrams: { decrement: deduction }
        }
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Create gift box order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}