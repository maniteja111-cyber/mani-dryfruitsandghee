import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(coupons)
  } catch (error) {
    console.error('Get coupons error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, discountType, value, minOrder, expiry } = await req.json()

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        expiry: expiry ? new Date(expiry) : null
      }
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Create coupon error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}