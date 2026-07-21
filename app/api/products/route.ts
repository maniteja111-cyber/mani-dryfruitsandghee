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
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const products = await prisma.product.findMany({
      where,
      include: { 
        category: true,
        extension: { include: { masterUnit: true } },
        productVariants: { include: { variant: true } }
      },
      orderBy: { [sort]: order }
    })

    const productsWithPrice = await Promise.all(products.map(async (p) => {
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
        ...p,
        productType,
        priceDisplay: getPriceDisplay(p, productType, basePrice),
        hasStock: stockInfo.hasStock,
        stockQuantity: stockInfo.stockQuantity,
        variantPrices: normalizedVariants
      }
    }))

    return NextResponse.json(productsWithPrice)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}