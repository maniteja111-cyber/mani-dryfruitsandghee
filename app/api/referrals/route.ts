import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { referralCode: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate code if missing
    if (!user.referralCode) {
      const code = `MANI${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      const updated = await prisma.user.update({
        where: { phone },
        data: { referralCode: code },
        select: { referralCode: true }
      })
      return NextResponse.json({ success: true, referralCode: updated.referralCode })
    }

    return NextResponse.json({ success: true, referralCode: user.referralCode })
  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}