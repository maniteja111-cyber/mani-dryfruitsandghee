import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

type UserWithAddressBook = {
  id: string
  phone: string
  addressBook: string | null
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true, addressBook: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const addresses: Address[] = (user as UserWithAddressBook).addressBook ? JSON.parse((user as UserWithAddressBook).addressBook as string) : []
  return NextResponse.json({ addresses })
}

export async function POST(request: NextRequest) {
  const { phone, address } = await request.json()
  if (!phone || !address) return NextResponse.json({ error: 'Phone and address required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true, addressBook: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const addresses: Address[] = (user as UserWithAddressBook).addressBook ? JSON.parse((user as UserWithAddressBook).addressBook as string) : []
  const newAddress: Address = { id: address.id || generateId(), ...address, isDefault: addresses.length === 0 }
  if (newAddress.isDefault) {
    addresses.forEach(a => { a.isDefault = false })
  }
  addresses.push(newAddress)

  await prisma.user.update({ where: { phone }, data: { addressBook: JSON.stringify(addresses) } })
  return NextResponse.json({ addresses })
}

export async function PUT(request: NextRequest) {
  const { phone, addressId, updates } = await request.json()
  if (!phone || !addressId) return NextResponse.json({ error: 'Phone and addressId required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true, addressBook: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const addresses: Address[] = (user as UserWithAddressBook).addressBook ? JSON.parse((user as UserWithAddressBook).addressBook as string) : []
  const idx = addresses.findIndex(a => a.id === addressId)
  if (idx === -1) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

  if (updates.isDefault) {
    addresses.forEach(a => { a.isDefault = false })
  }
  addresses[idx] = { ...addresses[idx], ...updates }
  await prisma.user.update({ where: { phone }, data: { addressBook: JSON.stringify(addresses) } })
  return NextResponse.json({ addresses })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const addressId = searchParams.get('addressId')
  if (!phone || !addressId) return NextResponse.json({ error: 'Phone and addressId required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true, addressBook: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const addresses: Address[] = (user as UserWithAddressBook).addressBook ? JSON.parse((user as UserWithAddressBook).addressBook as string) : []
  const filtered = addresses.filter(a => a.id !== addressId)
  await prisma.user.update({ where: { phone }, data: { addressBook: JSON.stringify(filtered) } })
  return NextResponse.json({ addresses: filtered })
}