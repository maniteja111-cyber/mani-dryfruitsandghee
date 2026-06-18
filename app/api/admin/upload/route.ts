import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = file.name.replace(/[^a-zA-Z0-9.]/g, '')

    let url: string

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        url = await uploadToCloudinary(buffer, filename)
      } catch (uploadError) {
        console.warn('Cloudinary upload failed, falling back to local:', uploadError)
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })
        const localFilename = `${Date.now()}-${filename}`
        const filepath = join(uploadsDir, localFilename)
        await writeFile(filepath, buffer)
        url = `/uploads/${localFilename}`
      }
    } else {
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })
      const localFilename = `${Date.now()}-${filename}`
      const filepath = join(uploadsDir, localFilename)
      await writeFile(filepath, buffer)
      url = `/uploads/${localFilename}`
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}