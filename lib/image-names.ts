export function sanitizeImageName(raw: string): string {
  const base = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!base) return `image-${Date.now()}`

  return base
}

export function buildPublicId(rawName: string, fallbackOriginalName: string): string {
  const sanitized = sanitizeImageName(rawName)
  const cleanedExtension = sanitized.replace(/\.[^/.]+$/, '')
  return cleanedExtension || sanitizeImageName(fallbackOriginalName.replace(/\.[^/.]+$/, '')) || `image-${Date.now()}`
}

export function makeUniquePublicIds(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map(name => {
    const base = buildPublicId(name, name)
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  })
}
