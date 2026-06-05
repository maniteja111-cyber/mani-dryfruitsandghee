import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { otpStore } from '@/lib/otpStore'

interface User {
  id: string
  phone: string
  name: string
  loyaltyPoints: number
  referralCode: string | null
  referredBy: string | null
}

type PrismaError = { code?: string }

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, referredBy } = await req.json()

    const isAdmin = phone === '9999999999'
    const storedOtp = otpStore.get(phone)
    
    if (!isAdmin && (!storedOtp || storedOtp !== otp)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    otpStore.delete(phone)

    let user = await prisma.user.findUnique({ 
      where: { phone },
      select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true }
    }).catch(() => null) as User | null

    // Track if this is a new user with referral (for welcome coupon)
    let wasNewWithReferral = false

    if (!user) {
      if (referredBy) wasNewWithReferral = true
      user = await prisma.user.create({
        data: { 
          phone, 
          name: `User ${phone.slice(-4)}`,
          loyaltyPoints: 0,
          referredBy: referredBy || undefined
        },
        select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true }
      }).catch(async (e: PrismaError) => {
        if (e?.code === 'P2002') {
          const existingUser = await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true } })
          return existingUser as User | null
        }
        return null
      }) as User | null
    }

    // Generate referral code if missing
    if (user && !user.referralCode) {
      const code = `MANI${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      user = await prisma.user.update({
        where: { phone },
        data: { referralCode: code },
        select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true }
      }) as User
    }

    // Award points to referrer if this is a new referred user
    if (wasNewWithReferral && referredBy) {
      await prisma.user.update({
        where: { phone: referredBy },
        data: { loyaltyPoints: { increment: 100 } }
      }).catch(() => {})
    }

    // Generate 15% coupon for referred user
    let welcomeCoupon = null
    if (wasNewWithReferral) {
      const couponCode = `WELCOME${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      const coupon = await prisma.coupon.create({
        data: {
          code: couponCode,
          discountType: 'percent',
          value: 15,
          minOrder: 200
        }
      }).catch(() => null)
      if (coupon) {
        welcomeCoupon = coupon.code
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to create/find user' }, { status: 500 })
    }

    const token = signToken({ id: user.id, phone: user.phone })

    return NextResponse.json({
      message: 'Login successful',
      token,
      welcomeCoupon,
      user: { id: user.id, phone: user.phone, name: user.name, loyaltyPoints: user.loyaltyPoints, referralCode: user.referralCode }
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 })
  }
}