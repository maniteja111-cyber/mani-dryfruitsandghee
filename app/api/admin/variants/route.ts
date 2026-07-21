import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const unitCode = searchParams.get('unitCode')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}

    if (unitCode) {
      where.unit = { code: unitCode }
    }

    if (activeOnly) {
      where.isActive = true
    }

    const variants = await prisma.masterVariant.findMany({
      where,
      include: { unit: true },
      orderBy: [{ unit: { sortOrder: 'asc' } }, { sortOrder: 'asc' }]
    })

    return NextResponse.json(variants)
  } catch (error) {
    console.error('Get variants error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { unitId, value, label, sortOrder } = body

    if (!unitId || !value || !label) {
      return NextResponse.json({ error: 'Unit ID, value, and label are required' }, { status: 400 })
    }

    const variant = await prisma.masterVariant.create({
      data: {
        unitId,
        value: value.trim(),
        label: label.trim(),
        sortOrder: sortOrder || 0
      },
      include: { unit: true }
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error: any) {
    console.error('Create variant error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Variant already exists for this unit' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}