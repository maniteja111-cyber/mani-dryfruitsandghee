import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      return NextResponse.json([])
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formatted = orders.map(order => ({
      id: order.id,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      couponCode: order.couponCode,
      discount: order.discount,
      orderItems: order.orderItems.map(item => ({
        name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        price: item.price,
        variant: item.variant
      }))
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Get user orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
