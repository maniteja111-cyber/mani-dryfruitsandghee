import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.product.count()
    return NextResponse.json({ success: true, productCount: count })
  } catch (error) {
    console.error('DB test error:', error)
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 })
  }
}