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
    let token
    try {
      token = signToken({ id: user.id, phone: user.phone })
    } catch (e) {
      console.error('JWT Error:', e)
      throw new Error('Failed to generate token')
    }

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { id: user.id, phone: user.phone, name: user.name }
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}