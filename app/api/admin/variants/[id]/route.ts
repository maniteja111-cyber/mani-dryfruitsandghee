import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { unitId, value, label, sortOrder, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 })
    }

    const existingVariant = await prisma.masterVariant.findUnique({
      where: { id },
      include: { products: { where: { isActive: true } } }
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (unitId && unitId !== existingVariant.unitId && existingVariant.products.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot change unit - variant is assigned to products' 
      }, { status: 409 })
    }

    const variant = await prisma.masterVariant.update({
      where: { id },
      data: {
        unitId: unitId || undefined,
        value: value ? value.trim() : undefined,
        label: label ? label.trim() : undefined,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      include: { unit: true }
    })

    return NextResponse.json(variant)
  } catch (error: any) {
    console.error('Update variant error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Variant already exists for this unit' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 })
    }

    const variant = await prisma.masterVariant.findUnique({
      where: { id },
      include: { products: { where: { isActive: true } } }
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (variant.products.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete variant - it is assigned to products. Remove from products first.' 
      }, { status: 409 })
    }

    await prisma.masterVariant.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Variant deleted successfully' })
  } catch (error: any) {
    console.error('Delete variant error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}