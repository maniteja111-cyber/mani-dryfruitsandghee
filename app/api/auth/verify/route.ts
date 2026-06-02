import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

import { otpStore } from '@/lib/otpStore'

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json()

    // Admin bypass - no OTP required for 9999999999
    const isAdmin = phone === '9999999999'
    const storedOtp = otpStore.get(phone)
    
    if (!isAdmin && (!storedOtp || storedOtp !== otp)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    // Clear OTP after use
    otpStore.delete(phone)

    // Find or create user - with graceful DB error handling
    let user
    try {
      user = await prisma.user.findUnique({ 
        where: { phone },
        cacheStrategy: { ttl: 30 }
      })
    } catch (dbError: any) {
      console.error('DB find error:', dbError.message)
    }

    if (!user) {
      try {
        user = await prisma.user.create({
          data: { phone, name: `User ${phone.slice(-4)}` }
        })
      } catch (createError: any) {
        console.error('DB create error:', createError.message)
        // If create fails due to race condition, try find again
        try {
          user = await prisma.user.findUnique({ where: { phone } })
        } catch {}
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    // Generate JWT
    const token = signToken({ id: user.id, phone: user.phone })

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { id: user.id, phone: user.phone, name: user.name }
    })
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}