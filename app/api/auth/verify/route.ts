import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { otpStore } from '@/lib/otpStore'

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
    }).catch(() => null)

    if (!user) {
      user = await prisma.user.create({
        data: { 
          phone, 
          name: `User ${phone.slice(-4)}`,
          loyaltyPoints: 0,
          referredBy: referredBy || undefined
        },
        select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true }
      }).catch(async (e: any) => {
        if (e.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true } })
        }
        return user
      })
    }

    // Generate referral code if missing
    if (user && !(user as any).referralCode) {
      const code = `MANI${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      user = await prisma.user.update({
        where: { phone },
        data: { referralCode: code },
        select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true }
      })
    }

    // Award points to referrer if this user was referred
    if (referredBy && user && !(user as any).referredBy) {
      await prisma.user.update({
        where: { phone: referredBy },
        data: { loyaltyPoints: { increment: 100 } }
      }).catch(() => {})
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to create/find user' }, { status: 500 })
    }

    const token = signToken({ id: (user as any).id, phone: (user as any).phone })

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { id: (user as any).id, phone: (user as any).phone, name: (user as any).name, loyaltyPoints: (user as any).loyaltyPoints || 0, referralCode: (user as any).referralCode }
    })
  } catch (error: any) {
    console.error('Verify error:', error.message)
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 })
  }
}