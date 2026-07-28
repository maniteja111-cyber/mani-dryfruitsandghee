import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getVisitorId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || ''

  const userAgent = req.headers.get('user-agent') || ''

  const id = `${realIp}-${userAgent}`

  return Buffer.from(id).toString('base64')
}

export async function POST(req: NextRequest) {
  try {
    const visitorId = getVisitorId(req)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.siteVisitUnique.upsert({
      where: { visitorId_date: { visitorId, date: today } },
      update: {},
      create: {
        visitorId,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
        userAgent: req.headers.get('user-agent') || undefined
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unique visit tracking error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayUnique = await prisma.siteVisitUnique.count({
      where: { date: { gte: today } }
    })

    const totalUnique = await prisma.siteVisitUnique.count()

    return NextResponse.json({
      todayUnique,
      totalUnique
    })
  } catch (error) {
    console.error('Get unique visits error:', error)
    return NextResponse.json({ todayUnique: 0, totalUnique: 0 }, { status: 500 })
  }
}
