const MAX_DIMENSION = 2000
const TARGET_BYTES = 200 * 1024
const MAX_BYTES = 250 * 1024
const MIN_QUALITY = 0.55
const INITIAL_QUALITY = 0.85
const WATERMARK_OPACITY = 0.6
const WATERMARK_WIDTH_RATIO = 0.15
const WATERMARK_MARGIN_RATIO = 0.05

export interface ProcessedImage {
  file: File
  originalName: string
  outputExtension: string
  width: number
  height: number
  bytes: number
}

function getOutputExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

function getMimeType(extension: string): string {
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  return 'image/jpeg'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

function loadLogo(): Promise<HTMLImageElement | null> {
  const logoPath = '/logo.png'
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  return new Promise((resolve) => {
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = logoPath
  })
}

function resizeDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  }
}

async function compressCanvas(
  canvas: HTMLCanvasElement,
  targetBytes: number,
  maxBytes: number,
  minQuality: number,
  initialQuality: number,
  outputExtension: string
): Promise<{ blob: Blob; quality: number }> {
  const mimeType = getMimeType(outputExtension)
  let low = minQuality
  let high = initialQuality
  let bestBlob: Blob | null = null
  let bestQuality = initialQuality

  const tryQuality = async (quality: number): Promise<Blob | null> => {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (result) => resolve(result),
        mimeType,
        quality
      )
    })
    return blob
  }

  const isWithinTarget = (blob: Blob): boolean => blob.size <= maxBytes

  let midBlob = await tryQuality(high)
  if (!midBlob) {
    throw new Error('Failed to encode image')
  }

  if (midBlob.size <= maxBytes) {
    bestBlob = midBlob
    bestQuality = high
  }

  let iterations = 0
  const maxIterations = 8

  while (low <= high && iterations < maxIterations) {
    iterations++
    midBlob = await tryQuality((low + high) / 2)
    if (!midBlob) break

    if (midBlob.size <= maxBytes) {
      bestBlob = midBlob
      bestQuality = (low + high) / 2
      low = (low + high) / 2 + 0.01
    } else {
      high = (low + high) / 2 - 0.01
    }
  }

  if (!bestBlob) {
    bestBlob = await tryQuality(minQuality)
    if (!bestBlob) {
      throw new Error('Failed to compress image')
    }
  }

  return { blob: bestBlob, quality: bestQuality }
}

async function processSingleFile(
  file: File,
  logo: HTMLImageElement | null
): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please select an image.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const { width, height } = img

    if (width === 0 || height === 0) {
      throw new Error('Invalid image dimensions')
    }

    const outputExtension = getOutputExtension(file.type)
    const mimeType = getMimeType(outputExtension)

    const dimensionSteps = [2000, 1800, 1600, 1400, 1200, 1000]

    for (const maxDim of dimensionSteps) {
      const { width: targetWidth, height: targetHeight } = resizeDimensions(
        width,
        height,
        maxDim
      )

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas not supported')
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      if (logo) {
        const logoWidth = Math.round(targetWidth * WATERMARK_WIDTH_RATIO)
        const logoHeight = Math.round((logo.height / logo.width) * logoWidth)
        const marginX = Math.round(targetWidth * WATERMARK_MARGIN_RATIO)
        const marginY = Math.round(targetHeight * WATERMARK_MARGIN_RATIO)
        const x = targetWidth - logoWidth - marginX
        const y = targetHeight - logoHeight - marginY

        ctx.globalAlpha = WATERMARK_OPACITY
        ctx.drawImage(logo, x, y, logoWidth, logoHeight)
        ctx.globalAlpha = 1
      }

      const { blob } = await compressCanvas(
        canvas,
        TARGET_BYTES,
        MAX_BYTES,
        MIN_QUALITY,
        INITIAL_QUALITY,
        outputExtension
      )

      if (blob.size <= MAX_BYTES) {
        const processedFile = new File([blob], file.name, {
          type: mimeType
        })

        return {
          file: processedFile,
          originalName: file.name,
          outputExtension,
          width: targetWidth,
          height: targetHeight,
          bytes: blob.size
        }
      }
    }

    throw new Error(
      'Image could not be compressed to the target size. Please try a smaller image.'
    )
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const logo = await loadLogo()
  if (!logo) {
    throw new Error(
      'Watermark logo could not be loaded. Please ensure /logo.png exists.'
    )
  }

  return processSingleFile(file, logo)
}

export async function processImages(
  files: File[]
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = []
  const logo = await loadLogo()
  
  if (!logo) {
    throw new Error(
      'Watermark logo could not be loaded. Please ensure /logo.png exists.'
    )
  }

  for (const file of files) {
    try {
      const processed = await processSingleFile(file, logo)
      results.push(processed)
    } catch (err) {
      console.error('Failed to process image:', file.name, err)
      throw err
    }
  }

  return results
}
