import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { code, name, type, symbol, sortOrder, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 })
    }

    const existingUnit = await prisma.masterUnit.findUnique({
      where: { id },
      include: { variants: true }
    })

    if (!existingUnit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    if (type && type !== existingUnit.type && existingUnit.variants.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot change unit type - variants are assigned to this unit' 
      }, { status: 409 })
    }

    const unit = await prisma.masterUnit.update({
      where: { id },
      data: {
        code: code ? code.trim().toLowerCase() : undefined,
        name: name ? name.trim() : undefined,
        type: type || undefined,
        symbol: symbol !== undefined ? symbol.trim() : undefined,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    })

    return NextResponse.json(unit)
  } catch (error: any) {
    console.error('Update unit error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unit code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 })
    }

    const unit = await prisma.masterUnit.findUnique({
      where: { id },
      include: { variants: true }
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    if (unit.variants.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete unit - variants are assigned to this unit. Remove variants first.' 
      }, { status: 409 })
    }

    await prisma.masterUnit.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Unit deleted successfully' })
  } catch (error: any) {
    console.error('Delete unit error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}