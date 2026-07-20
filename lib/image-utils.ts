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