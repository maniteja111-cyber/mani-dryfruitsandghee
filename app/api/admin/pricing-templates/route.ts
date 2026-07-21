import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
   try {
     const templates = await prisma.pricingTemplate.findMany({
       orderBy: { sortOrder: 'asc' }
     })

     return NextResponse.json(templates)
   } catch (error) {
     console.error('Get pricing templates error:', error)
     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
   }
 }

  export async function POST(req: NextRequest) {
    try {
      const body = await req.json()
      const { name, slug, description, isActive, sortOrder, isDefault } = body

      if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
      }

      const template = await prisma.pricingTemplate.create({
        data: {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description?.trim() || null,
          isActive: isActive !== false,
          sortOrder: sortOrder || 0,
          isDefault: isDefault || false
        }
      })

      return NextResponse.json(template, { status: 201 })
    } catch (error: any) {
      console.error('Create pricing template error:', error)
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Template slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }