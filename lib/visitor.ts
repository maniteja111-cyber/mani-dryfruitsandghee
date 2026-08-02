import { isBot, isLocalhost, getDeviceType, getBrowser, getOS } from './botDetector'

export interface VisitorInfo {
  visitorToken: string
  ip: string | null
  userAgent: string | null
  isBot: boolean
  deviceType: string
  browser: string
  os: string
  country: string | null
  referer: string | null
  path: string | null
}

export function getClientIP(req: { headers: Headers }): string | null {
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim())
    const firstPublic = ips.find(ip => ip && !isLocalhost(ip))
    if (firstPublic) return firstPublic
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp && !isLocalhost(realIp)) return realIp.trim()
  const xForwarded = req.headers.get('x-forwarded')
  if (xForwarded && !isLocalhost(xForwarded)) return xForwarded.trim()
  return null
}

export function getVisitorTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/visitor_token=([^;]+)/)
  if (!match) return null
  const token = match[1].trim()
  if (token && token.length > 0) return token
  return null
}

export function generateVisitorToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function parseVisitor(req: { headers: Headers }, pathname?: string): VisitorInfo {
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent')?.trim() || null
  const bot = isBot(userAgent)
  const deviceType = getDeviceType(userAgent)
  const browser = getBrowser(userAgent)
  const os = getOS(userAgent)
  const country = req.headers.get('cf-ipcountry')?.trim() || null
  const referer = req.headers.get('referer')?.trim() || null
  const path = pathname || req.headers.get('x-path')?.trim() || null

  return {
    visitorToken: '',
    ip,
    userAgent,
    isBot: bot,
    deviceType,
    browser,
    os,
    country,
    referer,
    path
  }
}
