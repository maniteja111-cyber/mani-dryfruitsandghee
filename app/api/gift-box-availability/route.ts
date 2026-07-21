import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const giftBoxId = searchParams.get('giftBoxId')

    if (!giftBoxId) {
      return NextResponse.json({ error: 'giftBoxId is required' }, { status: 400 })
    }

    const giftBox = await prisma.giftBox.findUnique({
      where: { id: giftBoxId },
      include: {
        eligibleProducts: {
          include: {
            product: true
          }
        }
      }
    })

    if (!giftBox) {
      return NextResponse.json({ error: 'Gift box not found' }, { status: 404 })
    }

    if (!giftBox.isActive) {
      return NextResponse.json({ available: 0, message: 'Gift box is not active' })
    }

    const startDate = giftBox.startDate
    const endDate = giftBox.endDate
    const now = new Date()

    if (startDate && now < startDate) {
      return NextResponse.json({ available: 0, message: 'Gift box not yet available' })
    }

    if (endDate && now > endDate) {
      return NextResponse.json({ available: 0, message: 'Gift box is no longer available' })
    }

    const maxOrdersPerCustomer = giftBox.maxOrdersPerCustomer || 0

    let minAvailableBoxes = Infinity

    for (const eligibility of giftBox.eligibleProducts) {
      const product = eligibility.product
      const variantGrams = 200

      const boxesPossible = Math.floor(product.stockGrams / variantGrams)

      if (boxesPossible < minAvailableBoxes) {
        minAvailableBoxes = boxesPossible
      }
    }

    const available = minAvailableBoxes === Infinity ? 0 : minAvailableBoxes

    return NextResponse.json({
      available,
      giftBox: {
        id: giftBox.id,
        name: giftBox.name,
        fixedPrice: giftBox.fixedPrice
      },
      canOrder: available > 0
    })
  } catch (error) {
    console.error('Get gift box availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}