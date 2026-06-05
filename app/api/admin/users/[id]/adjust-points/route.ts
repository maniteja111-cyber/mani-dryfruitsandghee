import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const { points, reason } = await req.json()

    if (!points || isNaN(parseInt(points))) {
      return NextResponse.json({ error: 'Valid points value required' }, { status: 400 })
    }

    const pts = parseInt(points)

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { loyaltyPoints: { increment: pts } }
      }),
      prisma.loyaltyTransaction.create({
        data: {
          userId: id,
          points: pts,
          type: 'manual',
          description: reason || 'Manual adjustment by admin'
        }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adjust points error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
