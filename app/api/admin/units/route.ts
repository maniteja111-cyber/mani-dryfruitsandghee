import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const units = await prisma.masterUnit.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json(units)
  } catch (error) {
    console.error('Get units error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, name, type, symbol, sortOrder } = body

    if (!code || !name || !type) {
      return NextResponse.json({ error: 'Code, name, and type are required' }, { status: 400 })
    }

    const unit = await prisma.masterUnit.create({
      data: {
        code: code.trim().toLowerCase(),
        name: name.trim(),
        type,
        symbol: (symbol || '').trim(),
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error: any) {
    console.error('Create unit error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unit code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}