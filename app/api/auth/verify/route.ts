import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

import { otpStore } from '@/lib/otpStore'

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json()

    const storedOtp = otpStore.get(phone)
    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    // Clear OTP after use
    otpStore.delete(phone)

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: `User ${phone.slice(-4)}` } // Default name
      })
    }

    // Generate JWT
    const token = signToken({ id: user.id, phone: user.phone })

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { id: user.id, phone: user.phone, name: user.name }
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}