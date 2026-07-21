import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    let synonymProductIds: string[] = []
    if (search) {
      const trimmed = search.trim()
      if (trimmed.length >= 2) {
        const normalized = trimmed.replace(/\s+/g, ' ')
        const synonymMatches = await prisma.productSynonym.findMany({
          where: { alias: { equals: normalized } },
          select: { productId: true }
        })
        synonymProductIds = synonymMatches.map(s => s.productId)
      }
    }

    const fieldWhere: any = { ...where }
    if (search) {
      const trimmed = search.trim()
      if (trimmed.length >= 2) {
        const normalized = trimmed.replace(/\s+/g, ' ')
        fieldWhere.OR = [
          { name: { contains: normalized } },
          { seoKeywords: { contains: normalized } },
          { shortDescription: { contains: normalized } },
          { description: { contains: normalized } },
          { category: { name: { contains: normalized } } }
        ]
      }
    }

    const [synonymProducts, fieldProducts] = await Promise.all([
      synonymProductIds.length > 0
        ? prisma.product.findMany({
            where: { ...where, id: { in: synonymProductIds } },
            include: { category: true, extension: { include: { masterUnit: true } }, productVariants: { include: { variant: true } } },
            orderBy: { [sort]: order }
          })
        : [],
      prisma.product.findMany({
        where: fieldWhere,
        include: { category: true, extension: { include: { masterUnit: true } }, productVariants: { include: { variant: true } } },
        orderBy: { [sort]: order }
      })
    ])

    const seen = new Set<string>()
    const products = [...synonymProducts, ...fieldProducts].filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    const normalized = search ? search.trim().replace(/\s+/g, ' ').toLowerCase() : ''
    const scored = products
      .map(p => {
        const name = (p.name || '').toLowerCase()
        const seoKeywords = (p.seoKeywords || '').toLowerCase()
        const shortDescription = (p.shortDescription || '').toLowerCase()
        const description = (p.description || '').toLowerCase()
        const categoryName = (p.category?.name || '').toLowerCase()

        let score = 0
        if (!normalized) {
          score = 1
        } else if (synonymProductIds.includes(p.id)) {
          score = 100
        } else if (name === normalized) {
          score = 90
        } else if (name.startsWith(normalized)) {
          score = 80
        } else if (name.includes(normalized)) {
          score = 50
        } else if (seoKeywords.includes(normalized)) {
          score = 40
        } else if (shortDescription.includes(normalized)) {
          score = 20
        } else if (description.includes(normalized)) {
          score = 10
        } else if (categoryName.includes(normalized)) {
          score = 15
        }

        return { ...p, _score: score }
      })
      .filter(p => p._score > 0)
      .sort((a, b) => {
        const scoreDiff = b._score - a._score
        if (scoreDiff !== 0) return scoreDiff
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    const safeProducts = scored.map((p) => {
      const extension = p.extension
      const productType = extension?.masterUnit?.type || 'weight'
      const basePrice = extension?.basePrice || p.pricePerKg || 0

      const variantPrices = (p.productVariants || [])
        .map((pv: any) => pv.variant)
        .filter(Boolean)
        .map((v: any) => ({
          variantId: v.id,
          label: v.label,
          price: Math.round(basePrice),
          unitType: v.unit?.type || 'weight',
          sizeValue: v.value
        }))

      const stockQuantity =
        productType === 'weight'
          ? p.stockGrams
          : extension?.stockQuantity ?? p.stockGrams ?? 0

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
        priceDisplay: `${productType === 'weight' ? '₹' : '₹'}${basePrice}/${productType === 'weight' ? 'kg' : productType === 'quantity' ? 'pieces' : productType === 'pack' ? 'packs' : 'litres'}`,
        hasStock: stockQuantity > 0,
        stockQuantity,
        variantPrices
      }
    })

    return NextResponse.json(safeProducts)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
