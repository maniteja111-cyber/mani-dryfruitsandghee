import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { code, discountType, value, minOrder, maxDiscount, expiry, usageLimit, perUserLimit, isActive } = await req.json()

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discountType,
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        expiry: expiry ? new Date(expiry) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : null,
        isActive
      }
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Update coupon error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await prisma.coupon.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Coupon deleted' })
  } catch (error) {
    console.error('Delete coupon error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}