import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.setting.findMany()
    const settingsObj = settings.reduce((acc: Record<string, string>, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})
    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('Get public settings error:', error)
    return NextResponse.json({}, { status: 500 })
  }
}