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
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

    let userPhone: string | undefined
    let userName: string | undefined
    try {
      const body = await req.json()
      userPhone = body.userPhone
      userName = body.userName
    } catch {
      // body is optional
    }

    await prisma.siteVisitUnique.upsert({
      where: { visitorId_dateOnly: { visitorId, dateOnly: today } },
      update: {
        userPhone: userPhone || undefined,
        userName: userName || undefined
      },
      create: {
        visitorId,
        date: now,
        dateOnly: today,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        userPhone,
        userName
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
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

    const todayUnique = await prisma.siteVisitUnique.count({
      where: { dateOnly: { gte: today } }
    })

    const totalUnique = await prisma.siteVisitUnique.count()

    const visits = await prisma.siteVisitUnique.findMany({
      orderBy: { dateOnly: 'desc' },
      take: 50,
      select: {
        id: true,
        dateOnly: true,
        visitorId: true,
        ip: true,
        userAgent: true
      }
    })

    return NextResponse.json({
      todayUnique,
      totalUnique,
      visits
    })
  } catch (error) {
    console.error('Get unique visits error:', error)
    return NextResponse.json({ todayUnique: 0, totalUnique: 0, visits: [] }, { status: 500 })
  }
}
