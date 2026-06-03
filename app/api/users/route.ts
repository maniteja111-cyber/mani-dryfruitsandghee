import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone required', loyaltyPoints: 0, referralCode: null })
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    }).catch(() => null)

    if (!user) {
      return NextResponse.json({ error: 'User not found', loyaltyPoints: 0, referralCode: null })
    }

    return NextResponse.json({ loyaltyPoints: (user as any).loyaltyPoints || 0, referralCode: (user as any).referralCode })
  } catch (error: any) {
    console.error('Get user error:', error.message)
    return NextResponse.json({ loyaltyPoints: 0, referralCode: null })
  }
}