import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const formattedOrder = {
      id: order.id,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      name: order.name,
      phone: order.phone,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      createdAt: order.createdAt,
      orderItems: order.orderItems.map(item => ({
        name: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        variant: item.variant || null
      }))
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Get single order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
