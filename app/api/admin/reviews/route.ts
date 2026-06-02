import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, slug: true } } }
    })
    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Get admin reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}