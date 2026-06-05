import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
