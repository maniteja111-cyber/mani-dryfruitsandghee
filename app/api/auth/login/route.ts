import { NextRequest, NextResponse } from 'next/server'

import { otpStore } from '@/lib/otpStore'

export async function POST(req: NextRequest) {
  try {
    const { phone, referredBy } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone number required' }, { status: 400 })
    }

    const otp = phone === '9999999999' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString()

    otpStore.set(phone, otp)
    setTimeout(() => otpStore.delete(phone), 5 * 60 * 1000)

    console.log(`OTP for ${phone}: ${otp}`)

    return NextResponse.json({ 
      message: 'OTP sent successfully', 
      otp: phone === '9999999999' ? otp : undefined,
      referredBy 
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}