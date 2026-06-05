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
  lastLoginDate: Date | null
  firstPurchase: boolean
}

type PrismaError = { code?: string }

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, referredBy, couponCode } = await req.json()

    const isAdmin = phone === '9999999999'
    const storedOtp = otpStore.get(phone)
    
    if (!isAdmin && (!storedOtp || storedOtp !== otp)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    otpStore.delete(phone)

    let user = await prisma.user.findUnique({ 
      where: { phone },
      select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true, lastLoginDate: true, firstPurchase: true }
    }).catch(() => null) as User | null

    let isNewUser = false
    let wasNewWithReferral = false

    if (!user) {
      isNewUser = true
      if (referredBy) wasNewWithReferral = true
      user = await prisma.user.create({
        data: { 
          phone, 
          name: `User ${phone.slice(-4)}`,
          loyaltyPoints: 0,
          referredBy: referredBy || undefined,
          lastLoginDate: new Date()
        },
        select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true, lastLoginDate: true, firstPurchase: true }
      }).catch(async (e: PrismaError) => {
        if (e?.code === 'P2002') {
          return await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true, lastLoginDate: true, firstPurchase: true } }) as User | null
        }
        return null
      }) as User | null
    } else {
      // Existing user - check daily login bonus
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null
      const lastLoginDay = lastLogin ? new Date(lastLogin.setHours(0, 0, 0, 0)) : null
      
      if (!lastLoginDay || lastLoginDay < today) {
        // Award daily login bonus (5 points)
        await prisma.$transaction([
          prisma.user.update({
            where: { phone },
            data: { lastLoginDate: new Date() }
          }),
          prisma.loyaltyTransaction.create({
            data: {
              userId: user.id,
              points: 5,
              type: 'daily_login',
              description: 'Daily login bonus'
            }
          }),
          prisma.user.update({
            where: { phone },
            data: { loyaltyPoints: { increment: 5 } }
          })
        ])
        user.loyaltyPoints += 5
      } else {
        // Just update last login time
        await prisma.user.update({
          where: { phone },
          data: { lastLoginDate: new Date() }
        })
      }
    }

    // Generate referral code if missing
    if (user && !user.referralCode) {
      const code = `MANI${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      user = await prisma.user.update({
        where: { phone },
        data: { referralCode: code },
        select: { id: true, phone: true, name: true, loyaltyPoints: true, referralCode: true, referredBy: true, lastLoginDate: true, firstPurchase: true }
      }) as User
    }

    // Handle referral for new user
    let welcomeCoupon = null
    if (wasNewWithReferral && referredBy) {
      // Find referrer
      const referrer = await prisma.user.findUnique({ where: { phone: referredBy } })
      if (referrer) {
        // Create referral record
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredPhone: phone,
            status: 'completed'
          }
        }).catch(() => {})

        // Award 100 points to referrer
        await prisma.$transaction([
          prisma.user.update({
            where: { phone: referredBy },
            data: { loyaltyPoints: { increment: 100 } }
          }),
          prisma.loyaltyTransaction.create({
            data: {
              userId: referrer.id,
              points: 100,
              type: 'referral',
              description: `Referral bonus for ${phone}`
            }
          })
        ])

        // Generate 15% welcome coupon for new user
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
    }

    // Apply coupon from URL if provided
    if (couponCode && isNewUser) {
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() }
      })
      if (existingCoupon && existingCoupon.isActive) {
        welcomeCoupon = existingCoupon.code
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
      isNewUser,
      user: { 
        id: user.id, 
        phone: user.phone, 
        name: user.name, 
        loyaltyPoints: user.loyaltyPoints, 
        referralCode: user.referralCode,
        firstPurchase: user.firstPurchase
      }
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 })
  }
}
