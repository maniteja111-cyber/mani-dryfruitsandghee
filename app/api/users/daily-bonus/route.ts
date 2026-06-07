import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null
    const lastLoginDay = lastLogin ? new Date(lastLogin.setHours(0, 0, 0, 0)) : null

    let bonusAwarded = false
    let updatedPoints = user.loyaltyPoints

    if (!lastLoginDay || lastLoginDay < today) {
      // Award daily bonus (5 points)
      updatedPoints += 5
      await prisma.$transaction([
        prisma.user.update({
          where: { phone },
          data: { 
            lastLoginDate: new Date(),
            loyaltyPoints: updatedPoints 
          }
        }),
        prisma.loyaltyTransaction.create({
          data: {
            userId: user.id,
            points: 5,
            type: 'daily_login',
            description: 'Daily login bonus'
          }
        })
      ])
      bonusAwarded = true
    }

    return NextResponse.json({
      loyaltyPoints: updatedPoints,
      referralCode: user.referralCode,
      bonusAwarded
    })
  } catch (error) {
    console.error('Daily bonus error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}