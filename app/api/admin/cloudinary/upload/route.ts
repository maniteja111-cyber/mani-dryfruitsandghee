import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { makeUniquePublicIds } from '@/lib/image-names'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary is not configured on the server.' }, { status: 500 })
    }

    const formData = await req.formData()
    const files = formData.getAll('images') as File[]
    const customFilenamesJson = formData.get('filenames') as string | null
    const customFilenames: string[] = customFilenamesJson ? JSON.parse(customFilenamesJson) : []

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const uniquePublicIds = makeUniquePublicIds(
      files.map((file, index) => customFilenames[index] || file.name)
    )

    const uploadPromises = files.map(async (file, index) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const publicId = uniquePublicIds[index]
      const filename = `${publicId}-${Date.now()}`

      return new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'auto',
              public_id: publicId,
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
              ],
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary bulk upload error:', error)
                reject(error)
              } else {
                resolve(result?.secure_url || '')
              }
            }
          )
          .end(buffer)
      })
    })

    const uploadedUrls = await Promise.all(uploadPromises)

    return NextResponse.json({
      success: true,
      count: uploadedUrls.length,
      urls: uploadedUrls
    })
  } catch (error: any) {
    console.error('Cloudinary bulk upload error:', error)
    return NextResponse.json({ error: error.message || 'Bulk upload failed' }, { status: 500 })
  }
}
