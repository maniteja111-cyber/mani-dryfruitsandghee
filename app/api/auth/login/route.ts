import { NextRequest, NextResponse } from 'next/server'

import { otpStore } from '@/lib/otpStore'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone number required' }, { status: 400 })
    }

    // Generate random 6-digit OTP (demo: 123456 for admin)
    const otp = phone === '9999999999' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP (expires in 5 minutes)
    otpStore.set(phone, otp)
    setTimeout(() => otpStore.delete(phone), 5 * 60 * 1000)

    // In real app, send OTP via WhatsApp/SMS
    if (phone !== '9999999999') console.log(`OTP for ${phone}: ${otp}`)

    return NextResponse.json({ message: 'OTP sent successfully', otp: phone === '9999999999' ? otp : undefined })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}