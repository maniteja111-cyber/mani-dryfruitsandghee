import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json()

    if (!code || !orderTotal) {
      return NextResponse.json({ error: 'Code and orderTotal are required' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
    }

    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
    }

    if (coupon.minOrder && orderTotal < coupon.minOrder) {
      return NextResponse.json({ 
        error: `Minimum order amount for this coupon is ₹${coupon.minOrder}` 
      }, { status: 400 })
    }

    // Calculate discount
    let discount = 0
    if (coupon.discountType === 'percent') {
      discount = (orderTotal * coupon.value) / 100
    } else {
      discount = coupon.value
    }

    // Don't allow discount more than order total
    discount = Math.min(discount, orderTotal)

    const finalTotal = Math.max(0, orderTotal - discount)

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      discount,
      finalTotal
    })

  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
