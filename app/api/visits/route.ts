import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await prisma.siteVisit.findFirst({ where: { date: today } })

    if (existing) {
      await prisma.siteVisit.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 }
      })
    } else {
      await prisma.siteVisit.create({
        data: { date: today, count: 1 }
      })
    }

    const total = await prisma.siteVisit.aggregate({ _sum: { count: true } })

    return NextResponse.json({ totalVisits: total._sum.count || 0 })
  } catch (error) {
    console.error('Visit tracking error:', error)
    return NextResponse.json({ totalVisits: 0 })
  }
}