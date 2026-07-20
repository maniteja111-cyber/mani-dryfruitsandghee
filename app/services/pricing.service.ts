import { prisma } from '@/lib/prisma'

export const UNIT_LABELS: Record<string, string> = {
  weight: 'Weight',
  quantity: 'Quantity',
  pack: 'Pack',
  volume: 'Volume'
}

export const UNIT_SYMBOLS: Record<string, string> = {
  weight: 'kg',
  quantity: 'pieces',
  pack: 'packs',
  volume: 'litres'
}

export function getSelectorLabel(productType: string | null | undefined): string {
  if (!productType || !(productType in UNIT_LABELS)) {
    return 'Select Variant'
  }
  return `Select ${UNIT_LABELS[productType]}`
}

export function getUnitSymbol(productType: string | null | undefined): string {
  if (!productType || !(productType in UNIT_SYMBOLS)) {
    return 'units'
  }
  return UNIT_SYMBOLS[productType]
}

export interface VariantPrice {
  variantId: string
  label: string
  price: number
  unitType: string
  sizeValue: string
}

export class PricingService {
  static async generateVariantPrices(
    productId: string,
    basePrice: number,
    templateId: string | null | undefined,
    variantIds: string[]
  ): Promise<VariantPrice[]> {
    if (variantIds.length === 0) return []

    // Special case: 'none' means "no template" - use base price at 100%
    if (templateId === 'none') {
      const variants = await prisma.masterVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
        include: { unit: true }
      })
      
      return variants.map(variant => ({
        variantId: variant.id,
        label: variant.label,
        price: Math.round(basePrice),
        unitType: variant.unit.type,
        sizeValue: variant.value
      }))
    }

    let effectiveTemplateId: string | null = null
    if (templateId === undefined) {
      const defaultTemplate = await prisma.pricingTemplate.findFirst({
        where: { isDefault: true, isActive: true }
      })
      effectiveTemplateId = defaultTemplate?.id || null
    } else if (templateId !== null && templateId !== 'none') {
      effectiveTemplateId = templateId
    }

    const [variants, rules] = await Promise.all([
      prisma.masterVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
        include: { unit: true }
      }),
      effectiveTemplateId
        ? prisma.pricingRule.findMany({
            where: { templateId: effectiveTemplateId, variantId: { in: variantIds } }
          })
        : Promise.resolve([])
    ])

    const ruleMap = new Map(rules.map(r => [r.variantId, r.percentage]))

    return variants.map(variant => {
      const percentage = ruleMap.get(variant.id) ?? 100
      const price = Math.round(basePrice * (percentage / 100))

      return {
        variantId: variant.id,
        label: variant.label,
        price,
        unitType: variant.unit.type,
        sizeValue: variant.value
      }
    })
  }

  static async getProductPrice(
    productId: string,
    variantId: string
  ): Promise<number | null> {
    try {
      const [product, variant] = await Promise.all([
        prisma.productExtension.findUnique({
          where: { productId }
        }),
        prisma.masterVariant.findUnique({
          where: { id: variantId },
          include: { unit: true }
        })
      ])

      if (!product?.basePrice || !variant) {
        return null
      }

      let templateId = product.pricingTemplateId
      if (!templateId) {
        const defaultTemplate = await prisma.pricingTemplate.findFirst({
          where: { isDefault: true, isActive: true }
        })
        templateId = defaultTemplate?.id || null
      }

      if (templateId) {
        const rule = await prisma.pricingRule.findUnique({
          where: {
            templateId_variantId: {
              templateId,
              variantId
            }
          }
        })
        if (rule) {
          return Math.round(product.basePrice * (rule.percentage / 100))
        }
      }

      return Math.round(product.basePrice)
    } catch (error) {
      console.error('Get product price error:', error)
      return null
    }
  }
}