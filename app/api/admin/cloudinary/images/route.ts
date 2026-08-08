import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const folder = searchParams.get('folder') || ''
    const nextCursor = searchParams.get('next_cursor') || undefined

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary is not configured on the server.' }, { status: 500 })
    }

    const options: any = {
      resource_type: 'image',
      max_results: 50,
      type: 'upload'
    }

    if (folder) {
      options.prefix = folder.endsWith('/') ? folder : `${folder}/`
    }

    if (nextCursor) {
      options.next_cursor = nextCursor
    }

    const result = await cloudinary.api.resources(options)

    const images = (result.resources || []).map((resource: any) => ({
      url: resource.secure_url,
      publicId: resource.public_id,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      bytes: resource.bytes,
      createdAt: resource.created_at
    }))

    return NextResponse.json({
      images,
      nextCursor: result.next_cursor || null,
      totalCount: result.total_count || images.length
    })
  } catch (error: any) {
    console.error('Cloudinary list images error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch images from Cloudinary' }, { status: 500 })
  }
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { publicIds } = body

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json({ error: 'No public IDs provided for bulk delete' }, { status: 400 })
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary is not configured on the server.' }, { status: 500 })
    }

    const results = await Promise.allSettled(
      publicIds.map((publicId: string) =>
        cloudinary.uploader.destroy(decodeURIComponent(publicId))
      )
    )

    const deleted = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      deleted,
      failed,
      message: `Deleted ${deleted} image(s)${failed > 0 ? `, ${failed} failed` : ''}`
    })
  } catch (error: any) {
    console.error('Cloudinary bulk delete error:', error)
    return NextResponse.json({ error: error.message || 'Bulk delete failed' }, { status: 500 })
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
