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

    if (!categoryId) {
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

    const updateData: any = {
      name,
      slug: cleanSlug,
      description,
      shortDescription,
      images: JSON.stringify(cleanImages),
      categoryId,
      isFeatured: isFeatured ?? existingProduct.isFeatured,
      isTodayOffer: isTodayOffer ?? existingProduct.isTodayOffer,
      isVisible: isVisible !== false,
      productOverview,
      whyChoose,
      ingredients,
      nutritionalInfo,
      storageInstructions,
      shelfLife,
      origin,
      benefits,
      shippingInfo,
      faqs: faqs && faqs.length > 0 ? JSON.stringify(faqs) : null,
      seoKeywords
    }

    if (currentProductType === 'weight') {
      updateData.stockGrams = stockGrams ? Math.round(parseFloat(String(stockGrams)) * 1000) : 0
      updateData.pricePerKg = pricePerKg ? parseFloat(pricePerKg) : null
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, extension: { include: { masterUnit: true } }, productVariants: { select: { variantId: true } } }
    })

    if (existingProduct.extension) {
      await prisma.productExtension.update({
        where: { productId: id },
        data: {
          unitTypeId: newUnitTypeId,
          basePrice: basePrice ? parseFloat(basePrice) : existingProduct.extension?.basePrice,
          stockQuantity: currentProductType === 'weight' ? undefined : (stockQuantity ? parseFloat(String(stockQuantity)) : 0),
          pricingTemplateId: pricingTemplateId === 'none' ? null : (pricingTemplateId || existingProduct.extension?.pricingTemplateId)
        }
      })
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