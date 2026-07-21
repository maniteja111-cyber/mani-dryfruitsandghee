import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        extension: { include: { masterUnit: true } },
        productVariants: {
          select: { variantId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, description, shortDescription, pricePerKg, stockGrams, images, categoryId, isFeatured, isTodayOffer, isVisible, productOverview, whyChoose, ingredients, nutritionalInfo, storageInstructions, shelfLife, origin, benefits, shippingInfo, faqs, seoKeywords, productType, stockQuantity, variantIds, basePrice, pricingTemplateId } = await req.json()

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    let cleanSlug = (slug || name || 'product')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (!cleanSlug) cleanSlug = `product-${Date.now()}`

    const cleanImages = (images || []).filter((img: string) => img && img.trim() !== '')

    const unitTypeId = productType ? await getUnitTypeId(productType) : null

    const product = await prisma.product.create({
      data: {
        name,
        slug: cleanSlug,
        description,
        shortDescription,
        stockGrams: productType === 'weight' ? Math.round(parseFloat(stockGrams)) : 0,
        pricePerKg: productType === 'weight' ? (parseFloat(pricePerKg) || 0) : null,
        images: JSON.stringify(cleanImages),
        categoryId,
        isFeatured: isFeatured || false,
        isTodayOffer: isTodayOffer || false,
        isVisible: isVisible !== false,
        productOverview: productOverview || null,
        whyChoose: whyChoose || null,
        ingredients: ingredients || null,
        nutritionalInfo: nutritionalInfo || null,
        storageInstructions: storageInstructions || null,
        shelfLife: shelfLife || null,
        origin: origin || null,
        benefits: benefits || null,
        shippingInfo: shippingInfo || null,
        faqs: faqs && faqs.length > 0 ? JSON.stringify(faqs) : null,
        seoKeywords: seoKeywords || null,
        extension: {
          create: {
            basePrice: parseFloat(basePrice) || 0,
            stockQuantity: productType === 'weight' ? undefined : (parseFloat(stockQuantity) || 0),
            unitTypeId,
            pricingTemplateId: pricingTemplateId === 'none' ? null : (pricingTemplateId || undefined)
          }
        },
        productVariants: variantIds && variantIds.length > 0 ? {
          create: variantIds.map((variantId: string, index: number) => ({
            id: `${productType === 'weight' ? 'weight' : 'nonweight'}_${Date.now()}_${index}`,
            variantId,
            sortOrder: index
          }))
        } : undefined
      },
      include: { category: true, extension: { include: { masterUnit: true } }, productVariants: { select: { variantId: true } } }
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

async function getUnitTypeId(productType: string): Promise<string | null> {
  const unit = await prisma.masterUnit.findFirst({
    where: { type: productType, isActive: true }
  })
  return unit?.id || null
}