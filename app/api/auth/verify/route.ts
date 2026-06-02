import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

import { otpStore } from '@/lib/otpStore'

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json()

    // Admin bypass - skip OTP check
    const isAdmin = phone === '9999999999'
    const storedOtp = otpStore.get(phone)
    
    if (!isAdmin && (!storedOtp || storedOtp !== otp)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    otpStore.delete(phone)

    let user = await prisma.user.findUnique({ where: { phone } }).catch(() => null)
    
    if (!user) {
      try {
        user = await prisma.user.create({
          data: { phone, name: `User ${phone.slice(-4)}` }
        })
      } catch {
        // Race condition - user might exist now
        user = await prisma.user.findUnique({ where: { phone } }).catch(() => null)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to create/find user' }, { status: 500 })
    }

    const token = signToken({ id: user.id, phone: user.phone })
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { id: user.id, phone: user.phone, name: user.name }
    })
  } catch (error: any) {
    console.error('Verify error:', error.message)
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 })
  }
}