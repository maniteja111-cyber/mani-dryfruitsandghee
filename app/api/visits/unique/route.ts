import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBot, isLocalhost } from '@/lib/botDetector'
import { getClientIP, getVisitorTokenFromCookie, generateVisitorToken, parseVisitor } from '@/lib/visitor'

export async function POST(req: NextRequest) {
  try {
    const visitor = parseVisitor(req)
    const ip = visitor.ip

    if (!ip) {
      return NextResponse.json({ success: true, ignored: true })
    }

    if (isLocalhost(ip)) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const cookieHeader = req.headers.get('cookie')
    let visitorToken = getVisitorTokenFromCookie(cookieHeader)

    if (!visitorToken) {
      visitorToken = generateVisitorToken()
    }

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

    const visitorId = Buffer.from(`${ip}-${visitor.userAgent || ''}`).toString('base64')

    const record = await prisma.siteVisitUnique.upsert({
      where: { visitorToken_dateOnly: { visitorToken, dateOnly: today } },
      update: {
        userPhone: userPhone || undefined,
        userName: userName || undefined
      },
      create: {
        visitorId,
        visitorToken,
        date: now,
        dateOnly: today,
        ip,
        userAgent: visitor.userAgent || undefined,
        isBot: visitor.isBot,
        deviceType: visitor.deviceType,
        browser: visitor.browser,
        os: visitor.os,
        country: visitor.country || undefined,
        referer: visitor.referer || undefined,
        path: visitor.path || undefined,
        userPhone,
        userName
      }
    })

    const response = NextResponse.json({ success: true, ignored: false })

    if (!getVisitorTokenFromCookie(cookieHeader)) {
      response.cookies.set('visitor_token', visitorToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })
    }

    return response
  } catch (error) {
    console.error('Unique visit tracking error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

    const todayHuman = await prisma.siteVisitUnique.count({
      where: { dateOnly: { gte: today }, isBot: false }
    })

    const todayBot = await prisma.siteVisitUnique.count({
      where: { dateOnly: { gte: today }, isBot: true }
    })

    const totalHuman = await prisma.siteVisitUnique.count({
      where: { isBot: false }
    })

    const totalBot = await prisma.siteVisitUnique.count({
      where: { isBot: true }
    })

    const visits = await prisma.siteVisitUnique.findMany({
      orderBy: { dateOnly: 'desc' },
      take: 50,
      select: {
        id: true,
        dateOnly: true,
        visitorId: true,
        visitorToken: true,
        ip: true,
        userAgent: true,
        isBot: true,
        deviceType: true,
        browser: true,
        os: true,
        country: true,
        referer: true,
        path: true,
        userPhone: true,
        userName: true
      }
    })

    return NextResponse.json({
      todayHumanVisitors: todayHuman,
      todayBotVisitors: todayBot,
      totalHumanVisitors: totalHuman,
      totalBotVisitors: totalBot,
      visits
    })
  } catch (error) {
    console.error('Get unique visits error:', error)
    return NextResponse.json({ todayHumanVisitors: 0, todayBotVisitors: 0, totalHumanVisitors: 0, totalBotVisitors: 0, visits: [] }, { status: 500 })
  }
}
