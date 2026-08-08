import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        extension: { include: { masterUnit: true } },
        productVariants: {
          select: { variantId: true }
        }
      }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await req.json()
    
    const { name, slug, description, shortDescription, pricePerKg, stockGrams, images, categoryId, isFeatured, isTodayOffer, isVisible, productOverview, whyChoose, ingredients, nutritionalInfo, storageInstructions, shelfLife, origin, benefits, shippingInfo, faqs, seoKeywords, productType, stockQuantity, variantIds, basePrice, pricingTemplateId } = body

    const isPartialUpdate = [isFeatured, isTodayOffer, isVisible].some(field => field !== undefined) &&
      !name && !slug && !description && !shortDescription && !pricePerKg && !stockGrams && !images && !productOverview && !whyChoose && !ingredients && !nutritionalInfo && !storageInstructions && !shelfLife && !origin && !benefits && !shippingInfo && !faqs && !seoKeywords && !productType && !stockQuantity && !variantIds && !basePrice && !pricingTemplateId

    if (!isPartialUpdate && !categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    let cleanImages: string[] = []
    if (images) {
      if (Array.isArray(images)) {
        cleanImages = images.filter((img: string) => img && img.trim() !== '')
      } else if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images)
          cleanImages = (Array.isArray(parsed) ? parsed : [parsed]).filter((img: string) => img && img.trim() !== '')
        } catch {
          cleanImages = [images]
        }
      }
    }

    let cleanSlug = slug || name || 'product'
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (!cleanSlug) cleanSlug = `product-${Date.now()}`

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { extension: { include: { masterUnit: true } } }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const currentProductType = existingProduct.extension?.masterUnit?.type || 'weight'
    const newUnitTypeId = productType ? await getUnitTypeId(productType) : existingProduct.extension?.unitTypeId

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (slug !== undefined || name !== undefined) updateData.slug = cleanSlug
    if (description !== undefined) updateData.description = description
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (images !== undefined) updateData.images = JSON.stringify(cleanImages)
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (isTodayOffer !== undefined) updateData.isTodayOffer = isTodayOffer
    if (isVisible !== undefined) updateData.isVisible = isVisible !== false
    if (productOverview !== undefined) updateData.productOverview = productOverview
    if (whyChoose !== undefined) updateData.whyChoose = whyChoose
    if (ingredients !== undefined) updateData.ingredients = ingredients
    if (nutritionalInfo !== undefined) updateData.nutritionalInfo = nutritionalInfo
    if (storageInstructions !== undefined) updateData.storageInstructions = storageInstructions
    if (shelfLife !== undefined) updateData.shelfLife = shelfLife
    if (origin !== undefined) updateData.origin = origin
    if (benefits !== undefined) updateData.benefits = benefits
    if (shippingInfo !== undefined) updateData.shippingInfo = shippingInfo
    if (faqs !== undefined) updateData.faqs = faqs && faqs.length > 0 ? JSON.stringify(faqs) : null
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords

    if (currentProductType === 'weight') {
      if (stockGrams !== undefined && stockGrams !== null && stockGrams !== '') {
        updateData.stockGrams = Math.round(parseFloat(String(stockGrams)))
      }
      if (pricePerKg !== undefined && pricePerKg !== null && pricePerKg !== '') {
        updateData.pricePerKg = parseFloat(pricePerKg)
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, extension: { include: { masterUnit: true } }, productVariants: { select: { variantId: true } } }
    })

    if (existingProduct.extension) {
      const extensionData: any = {}
      if (productType !== undefined) extensionData.unitTypeId = newUnitTypeId
      if (basePrice !== undefined) extensionData.basePrice = basePrice ? parseFloat(basePrice) : existingProduct.extension?.basePrice
      if (stockQuantity !== undefined) extensionData.stockQuantity = currentProductType === 'weight' ? undefined : (stockQuantity ? parseFloat(String(stockQuantity)) : 0)
      if (pricingTemplateId !== undefined) extensionData.pricingTemplateId = pricingTemplateId === 'none' ? null : (pricingTemplateId || existingProduct.extension?.pricingTemplateId)

      if (Object.keys(extensionData).length > 0) {
        await prisma.productExtension.update({
          where: { productId: id },
          data: extensionData
        })
      }
    }

    if (variantIds && variantIds.length > 0) {
      await prisma.productProductVariant.deleteMany({ where: { productId: id } })
      await prisma.productProductVariant.createMany({
        data: variantIds.map((variantId: string, index: number) => ({
          id: `${productType === 'weight' ? 'weight' : 'nonweight'}_${Date.now()}_${index}`,
          productId: id,
          variantId,
          sortOrder: index
        }))
      })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    
    await prisma.productProductVariant.deleteMany({ where: { productId: id } })
    await prisma.productExtension.deleteMany({ where: { productId: id } })
    await prisma.product.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUnitTypeId(productType: string): Promise<string | null> {
  const unit = await prisma.masterUnit.findFirst({
    where: { type: productType, isActive: true }
  })
  return unit?.id || null
}