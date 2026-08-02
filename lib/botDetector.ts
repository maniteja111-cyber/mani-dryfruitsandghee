export const BOT_PATTERNS = [
  'googlebot',
  'googleother',
  'bingbot',
  'applebot',
  'ahrefsbot',
  'headlesschrome',
  'crawler',
  'spider',
  'bot',
  'facebookexternalhit',
  'linkedinbot',
  'slurp',
  'duckduckbot',
  'semrushbot',
  'petalbot',
  'bytespider'
]

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  const lower = userAgent.toLowerCase()
  return BOT_PATTERNS.some(pattern => lower.includes(pattern))
}

export function isLocalhost(ip: string | null | undefined): boolean {
  if (!ip) return false
  const trimmed = ip.trim()
  if (trimmed === '::1' || trimmed === '127.0.0.1') return true
  if (trimmed.startsWith('192.168.')) return true
  if (trimmed.startsWith('10.')) return true
  if (trimmed.startsWith('172.16.') || trimmed.startsWith('172.17.') || trimmed.startsWith('172.18.') || trimmed.startsWith('172.19.') || trimmed.startsWith('172.20.') || trimmed.startsWith('172.21.') || trimmed.startsWith('172.22.') || trimmed.startsWith('172.23.') || trimmed.startsWith('172.24.') || trimmed.startsWith('172.25.') || trimmed.startsWith('172.26.') || trimmed.startsWith('172.27.') || trimmed.startsWith('172.28.') || trimmed.startsWith('172.29.') || trimmed.startsWith('172.30.') || trimmed.startsWith('172.31.')) {
    return true
  }
  return false
}

export function getDeviceType(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Desktop'
  const lower = userAgent.toLowerCase()
  if (isBot(userAgent)) return 'Bot'
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))|kindle/i.test(userAgent)) return 'Tablet'
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)) return 'Mobile'
  return 'Desktop'
}

export function getBrowser(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown'
  const lower = userAgent.toLowerCase()
  if (lower.includes('edg/') || lower.includes('edge')) return 'Edge'
  if (lower.includes('opr/') || lower.includes('opera')) return 'Opera'
  if (lower.includes('chrome') && !lower.includes('edg')) return 'Chrome'
  if (lower.includes('safari') && !lower.includes('chrome')) return 'Safari'
  if (lower.includes('firefox')) return 'Firefox'
  return 'Other'
}

export function getOS(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown'
  const lower = userAgent.toLowerCase()
  if (lower.includes('windows')) return 'Windows'
  if (lower.includes('android')) return 'Android'
  if (lower.includes('iphone') || lower.includes('ipad')) return 'iOS'
  if (lower.includes('mac os') || lower.includes('macos')) return 'macOS'
  if (lower.includes('linux')) return 'Linux'
  return 'Other'
}
