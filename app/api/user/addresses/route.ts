import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface Address {
  id: string
  label: string
  name: string
  phone: string
  address: string
  address2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const addresses: Address[] = (user as any).addressBook ? JSON.parse((user as any).addressBook) : []
    return NextResponse.json(addresses)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, label, name, phone, address, address2, city, state, pincode, isDefault } = body

  if (!userId || !label || !name || !phone || !address || !city || !state || !pincode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const addresses: Address[] = (user as any).addressBook ? JSON.parse((user as any).addressBook) : []
    
    if (isDefault) {
      addresses.forEach(a => { a.isDefault = false })
    }

    const newAddress: Address = {
      id: generateId(),
      label, name, phone, address, address2, city, state, pincode, isDefault: isDefault || false
    }
    addresses.push(newAddress)

    await (prisma.user.update as any)({
      where: { id: userId },
      data: { addressBook: JSON.stringify(addresses) }
    })

    return NextResponse.json(newAddress, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, userId, label, name, phone, address, address2, city, state, pincode, isDefault } = body

  if (!id || !userId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const addresses: Address[] = (user as any).addressBook ? JSON.parse((user as any).addressBook) : []
    
    if (isDefault) {
      addresses.forEach(a => { a.isDefault = false })
    }

    const idx = addresses.findIndex(a => a.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

    addresses[idx] = { id, label, name, phone, address, address2, city, state, pincode, isDefault }

    await (prisma.user.update as any)({
      where: { id: userId },
      data: { addressBook: JSON.stringify(addresses) }
    })

    return NextResponse.json(addresses[idx])
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const userId = request.nextUrl.searchParams.get('userId')
  if (!id || !userId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const addresses: Address[] = (user as any).addressBook ? JSON.parse((user as any).addressBook) : []
    const filtered = addresses.filter(a => a.id !== id)

    await (prisma.user.update as any)({
      where: { id: userId },
      data: { addressBook: JSON.stringify(filtered) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}