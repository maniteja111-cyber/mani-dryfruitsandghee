export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false
  
  const trimmed = url.trim()
  if (trimmed === '' || trimmed === '""') return false
  
  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed === 'string') {
      return isValidImageUrl(parsed)
    }
    return false
  } catch {
    // Not JSON, treat as direct URL
  }
  
  try {
    const parsedUrl = new URL(trimmed)
    const invalidHosts = ['example.com', 'example.org', 'example.net', 'placeholder.com', 'via.placeholder.com']
    if (invalidHosts.includes(parsedUrl.hostname)) return false
    if (!parsedUrl.protocol || !['http:', 'https:'].includes(parsedUrl.protocol)) return false
    return true
  } catch {
    return false
  }
}

export function getImageSrc(images: string[] | any, fallback: string = '/placeholder.svg'): string {
  if (!Array.isArray(images) || images.length === 0) return fallback
  
  for (const img of images) {
    if (isValidImageUrl(img)) {
      return img
    }
  }
  
  return fallback
}

export function shouldUseNextImage(url: string | undefined | null): boolean {
  return isValidImageUrl(url)
}

export function addImageCacheBuster(url: string, updatedAt?: string | null): string {
  if (!url || typeof url !== 'string') return url
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now()

  try {
    const urlObj = new URL(trimmed)
    urlObj.searchParams.set('v', String(timestamp))
    return urlObj.toString()
  } catch {
    const separator = trimmed.includes('?') ? '&' : '?'
    return `${trimmed}${separator}v=${timestamp}`
  }
}

export function getCacheBustedImages(images: string[] | any, updatedAt?: string | null): string[] {
  let raw: string[] = []
  if (Array.isArray(images)) {
    raw = images.filter(Boolean)
  } else if (typeof images === 'string' && images.trim()) {
    try {
      let parsed = JSON.parse(images)
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed)
      }
      if (Array.isArray(parsed)) {
        raw = parsed.filter(Boolean)
      } else if (typeof parsed === 'string') {
        raw = [parsed]
      }
    } catch {
      raw = [images]
    }
  }

  return raw
    .map(img => {
      if (typeof img === 'string' && img.trim().startsWith('"')) {
        try { return JSON.parse(img) } catch { return img }
      }
      return img
    })
    .filter((img): img is string => typeof img === 'string' && img.trim() !== '')
    .map(img => addImageCacheBuster(img, updatedAt))
}
