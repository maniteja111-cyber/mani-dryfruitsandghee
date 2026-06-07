import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData()
    const file: File | null = data.get('image') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let processedBuffer: Buffer = buffer
    let filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`

    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png') || filename.endsWith('.webp')) {
      try {
        const sharp = (await import('sharp')).default
        const format = filename.endsWith('.webp') ? 'webp' : filename.endsWith('.png') ? 'png' : 'jpeg'
        const quality = format === 'png' ? 80 : 75
        
        processedBuffer = await sharp(Buffer.from(bytes))
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .toFormat(format as 'jpeg' | 'png' | 'webp', { quality })
          .toBuffer() as Buffer
        
        filename = filename.replace(/\.[^/.]+$/, `.${format}`)
      } catch (sharpError) {
        console.warn('Sharp processing failed, using original:', sharpError)
      }
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, processedBuffer)

    const imageUrl = `/uploads/${filename}`

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}