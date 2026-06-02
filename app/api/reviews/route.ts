import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { productId, approved: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, name, phone, rating, comment } = await req.json()

    if (!productId || !name || !phone || !rating || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        productId,
        name,
        phone,
        rating: Number(rating),
        comment
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}