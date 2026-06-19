import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const phone = searchParams.get('phone')

    if (!userId && !phone) {
      return NextResponse.json({ error: 'userId or phone required' }, { status: 400 })
    }

    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } else if (phone) {
      user = await prisma.user.findUnique({ where: { phone } })
    }

    if (!user) {
      return NextResponse.json([])
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            pricePerKg: true,
            stockGrams: true,
            images: true
          }
        }
      }
    })

    const products = wishlistItems.map(item => item.product)
    return NextResponse.json(products)
  } catch (error) {
    console.error('Get wishlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, phone } = await req.json()

    if ((!userId && !phone) || !productId) {
      return NextResponse.json({ error: 'userId/phone and productId required' }, { status: 400 })
    }

    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } else if (phone) {
      user = await prisma.user.findUnique({ where: { phone } })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      },
      update: {},
      create: {
        userId: user.id,
        productId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add to wishlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, productId, phone } = await req.json()

    if ((!userId && !phone) || !productId) {
      return NextResponse.json({ error: 'userId/phone and productId required' }, { status: 400 })
    }

    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } else if (phone) {
      user = await prisma.user.findUnique({ where: { phone } })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.wishlist.deleteMany({
      where: {
        userId: user.id,
        productId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
