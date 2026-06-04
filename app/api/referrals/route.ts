import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('check')
    
    if (!code) {
      return NextResponse.json({ valid: false, error: 'Code required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { referralCode: code }
    }).catch(() => null)

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Invalid code' })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Server error' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    }).catch(() => null)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate code if missing
    if (!user.referralCode) {
      const code = `MANI${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      await prisma.user.update({
        where: { phone },
        data: { referralCode: code }
      })
      return NextResponse.json({ success: true, referralCode: code })
    }

    return NextResponse.json({ success: true, referralCode: user.referralCode })
  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}