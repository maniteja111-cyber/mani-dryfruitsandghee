import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PricingService } from '@/app/services/pricing.service'
import { getNormalizedVariants } from '@/app/services/variant.service'

function getPriceDisplay(product: any, productType: string, basePrice: number): string {
  const units: Record<string, { symbol: string; plural: string }> = {
    weight: { symbol: '₹', plural: 'kg' },
    quantity: { symbol: '₹', plural: 'pieces' },
    pack: { symbol: '₹', plural: 'packs' },
    volume: { symbol: '₹', plural: 'litres' }
  }
  
  const unit = units[productType] || units.weight
  return `${unit.symbol}${basePrice}/${unit.plural}`
}

function getStockInfo(product: any, productType: string): { hasStock: boolean; stockQuantity: number } {
  if (productType === 'weight') {
    return { 
      hasStock: product.stockGrams > 0, 
      stockQuantity: product.stockGrams 
    }
  }
  
  const stockQuantity = product.extension?.stockQuantity ?? product.stockGrams ?? 0
  return { 
    hasStock: stockQuantity > 0, 
    stockQuantity 
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    const where: any = {}
    if (category) {
      where.categoryId = category
    }

    let synonymMatches: { productId: string }[] = []
    if (search) {
      const trimmed = search.trim()
      if (trimmed.length >= 2) {
        const normalized = trimmed.replace(/\s+/g, ' ')

        synonymMatches = await prisma.productSynonym.findMany({
          where: {
            alias: {
              equals: normalized
            }
          },
          select: {
            productId: true
          }
        })
      }
    }

    const synonymProductIds = synonymMatches.map(s => s.productId)
    if (synonymProductIds.length > 0) {
      console.info('Search synonym matches', {
        query: search?.trim(),
        synonymProductIds
      })
    }

    const fieldWhere: any = { ...where }
    if (search) {
      const trimmed = search.trim()
      if (trimmed.length >= 2) {
        const normalized = trimmed.replace(/\s+/g, ' ')
        fieldWhere.OR = [
          { name: { equals: normalized } },
          { name: { contains: normalized, mode: 'insensitive' } },
          { seoKeywords: { contains: normalized, mode: 'insensitive' } },
          { shortDescription: { contains: normalized, mode: 'insensitive' } },
          { description: { contains: normalized, mode: 'insensitive' } },
          { category: { name: { contains: normalized, mode: 'insensitive' } } }
        ]
      }
    }

    const [synonymProducts, fieldProducts] = await Promise.all([
      synonymProductIds.length > 0
        ? prisma.product.findMany({
            where: {
              ...where,
              id: { in: synonymProductIds }
            },
            include: { 
              category: true,
              extension: { include: { masterUnit: true } },
              productVariants: { include: { variant: true } }
            },
            orderBy: { [sort]: order }
          })
        : Promise.resolve([]),
      prisma.product.findMany({
        where: fieldWhere,
        include: { 
          category: true,
          extension: { include: { masterUnit: true } },
          productVariants: { include: { variant: true } }
        },
        orderBy: { [sort]: order }
      })
    ])

    console.info('Search product fetch complete', {
      query: search?.trim(),
      synonymCount: synonymProducts.length,
      fieldCount: fieldProducts.length
    })

    const seen = new Set<string>()
    const products = [...synonymProducts, ...fieldProducts].filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    console.info('Search merged product count', {
      query: search?.trim(),
      count: products.length
    })

    let productsWithPrice: any[] = []
    try {
      productsWithPrice = await Promise.all(products.map(async (p) => {
        try {
          const productType = p.extension?.masterUnit?.type || 'weight'
          const basePrice = p.extension?.basePrice || p.pricePerKg || 0

          const variants = p.productVariants.map((pv: any) => pv.variantId)
          const templateId: string | null = p.extension?.pricingTemplateId || null

          const prices = await PricingService.generateVariantPrices(
            p.id,
            basePrice,
            templateId,
            variants
          )

          const normalizedVariants = getNormalizedVariants(prices)
          const stockInfo = getStockInfo(p, productType)

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            images: p.images,
            categoryId: p.categoryId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            isFeatured: p.isFeatured,
            isTodayOffer: p.isTodayOffer,
            isVisible: p.isVisible,
            faqs: p.faqs,
            ingredients: p.ingredients,
            productOverview: p.productOverview,
            seoKeywords: p.seoKeywords,
            shippingInfo: p.shippingInfo,
            storageInstructions: p.storageInstructions,
            whyChoose: p.whyChoose,
            benefits: p.benefits,
            nutritionalInfo: p.nutritionalInfo,
            origin: p.origin,
            shelfLife: p.shelfLife,
            shortDescription: p.shortDescription,
            pricePerKg: p.pricePerKg,
            stockGrams: p.stockGrams,
            category: p.category,
            extension: p.extension,
            productVariants: p.productVariants,
            productType,
            priceDisplay: getPriceDisplay(p, productType, basePrice),
            hasStock: stockInfo.hasStock,
            stockQuantity: stockInfo.stockQuantity,
            variantPrices: normalizedVariants
          }
        } catch (error) {
          console.error(`Failed to process product ${p.id}:`, error)
          return null
        }
      }))
    } catch (error) {
      console.error('Search product processing error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}