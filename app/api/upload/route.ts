import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { buildPublicId } from '@/lib/image-names'

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData()
    const file: File | null = data.get('image') as unknown as File
    const customFilename = data.get('filename') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const publicId = buildPublicId(customFilename || '', file.name)
    const filename = `${publicId}-${Date.now()}`

    let imageUrl: string

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        imageUrl = await uploadToCloudinary(buffer, filename, publicId)
      } catch (uploadError) {
        console.warn('Cloudinary upload failed, falling back to local:', uploadError)
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })
        const localFilename = `${publicId}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
        const filepath = join(uploadsDir, localFilename)
        await writeFile(filepath, buffer)
        imageUrl = `/uploads/${localFilename}`
      }
    } else {
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })
      const localFilename = `${publicId}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
      const filepath = join(uploadsDir, localFilename)
      await writeFile(filepath, buffer)
      imageUrl = `/uploads/${localFilename}`
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}