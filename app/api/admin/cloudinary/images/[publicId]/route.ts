import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function DELETE(req: NextRequest, context: any) {
  try {
    const { publicId } = await context.params

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary is not configured on the server.' }, { status: 500 })
    }

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    const decodedPublicId = decodeURIComponent(publicId)

    await cloudinary.uploader.destroy(decodedPublicId)

    return NextResponse.json({ success: true, message: 'Image deleted successfully' })
  } catch (error: any) {
    console.error('Cloudinary delete error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete image' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: any) {
  try {
    const { publicId } = await context.params
    const body = await req.json()
    const { newPublicId } = body

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary is not configured on the server.' }, { status: 500 })
    }

    if (!publicId || !newPublicId) {
      return NextResponse.json({ error: 'Public ID and new Public ID are required' }, { status: 400 })
    }

    const decodedPublicId = decodeURIComponent(publicId)
    const decodedNewPublicId = decodeURIComponent(newPublicId)

    if (decodedPublicId === decodedNewPublicId) {
      return NextResponse.json({ success: true, message: 'No changes made', publicId: decodedPublicId })
    }

    const result = await cloudinary.uploader.rename(decodedPublicId, decodedNewPublicId)

    return NextResponse.json({
      success: true,
      message: 'Image renamed successfully',
      publicId: result.public_id,
      secureUrl: result.secure_url
    })
  } catch (error: any) {
    console.error('Cloudinary rename error:', error)
    return NextResponse.json({ error: error.message || 'Failed to rename image' }, { status: 500 })
  }
}
