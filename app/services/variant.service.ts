import { prisma } from '@/lib/prisma'
import { MasterVariant, ProductProductVariant } from '@prisma/client'
import { VariantPrice } from './pricing.service'

export interface VariantWithUnit extends MasterVariant {
  unit: { id: string; code: string; name: string; type: string; symbol: string }
}

export interface ProductVariantWithDetails extends ProductProductVariant {
  variant: VariantWithUnit
}

export interface NormalizedVariant {
  id: string
  label: string
  size: string
  price: number
  unitType: string
  grams: number
  sizeValue: string
}

export function normalizeVariant(vp: VariantPrice): NormalizedVariant {
  const value = parseInt(vp.sizeValue) || 0
  const grams = vp.unitType === 'weight' && value === 1 ? 1000 : value
  return {
    id: vp.variantId,
    label: vp.label,
    size: vp.label,
    price: vp.price,
    unitType: vp.unitType,
    grams,
    sizeValue: vp.sizeValue
  }
}

export function getNormalizedVariants(variantPrices: VariantPrice[]): NormalizedVariant[] {
  if (!variantPrices || variantPrices.length === 0) return []
  return variantPrices.map(normalizeVariant)
}

export function getProductType(variantPrices: VariantPrice[], productVariants: { variantId: string }[]): string | null {
  if (variantPrices && variantPrices.length > 0) {
    return variantPrices[0].unitType
  }
  if (productVariants && productVariants.length > 0) {
    return 'weight'
  }
  return null
}

export class VariantService {
  static async getAvailableVariants(
    productId: string,
    stockGrams: number = 0,
    stockQuantity: number = 0
  ): Promise<ProductVariantWithDetails[]> {
    try {
      const productVariants = await prisma.productProductVariant.findMany({
        where: {
          productId,
          isActive: true
        },
        include: {
          variant: {
            include: { unit: true }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })

      return productVariants.filter(pv => {
        const variant = pv.variant
        const size = parseInt(variant.value)

        if (isNaN(size)) return true

        if (variant.unit.type === 'weight' || variant.unit.type === 'g') {
          return size <= stockGrams
        }
        if (variant.unit.type === 'quantity' || variant.unit.type === 'piece') {
          return size <= stockQuantity
        }
        return true
      })
    } catch (error) {
      console.error('Get available variants error:', error)
      return []
    }
  }

  static async getDefaultVariant(productId: string): Promise<ProductVariantWithDetails | null> {
    try {
      const productVariants = await prisma.productProductVariant.findMany({
        where: {
          productId,
          isActive: true
        },
        include: {
          variant: {
            include: { unit: true }
          }
        },
        orderBy: [{ sortOrder: 'asc' }, { variant: { createdAt: 'asc' } }],
        take: 1
      })

      return productVariants[0] || null
    } catch (error) {
      console.error('Get default variant error:', error)
      return null
    }
  }

  static async getMasterVariantsByUnit(unitCode: string): Promise<VariantWithUnit[]> {
    return prisma.masterVariant.findMany({
      where: {
        unit: { code: unitCode },
        isActive: true
      },
      include: { unit: true },
      orderBy: { sortOrder: 'asc' }
    })
  }

  static async getAllActiveVariants(): Promise<VariantWithUnit[]> {
    return prisma.masterVariant.findMany({
      where: { isActive: true },
      include: { unit: true },
      orderBy: [{ unit: { sortOrder: 'asc' } }, { sortOrder: 'asc' }]
    })
  }

  static async getVariantById(variantId: string): Promise<VariantWithUnit | null> {
    return prisma.masterVariant.findUnique({
      where: { id: variantId },
      include: { unit: true }
    })
  }

  static async getOrCreateVariantByLabel(label: string, unitType: string): Promise<string | null> {
    try {
      const unit = await prisma.masterUnit.findFirst({
        where: { type: unitType, isActive: true }
      })
      
      if (!unit) return null
      
      const existingVariant = await prisma.masterVariant.findFirst({
        where: { unitId: unit.id, label }
      })
      
      if (existingVariant) return existingVariant.id
      
      const value = label.replace(' Pack', '').replace(' Pieces', '').replace('Piece', '').replace('g', '').replace('L', '').replace('l', '').trim()
      
      const newVariant = await prisma.masterVariant.create({
        data: {
          unitId: unit.id,
          value,
          label,
          sortOrder: 0,
          isActive: true
        }
      })
      
      return newVariant.id
    } catch (error) {
      console.error('Error creating variant:', error)
      return null
    }
  }

  static async assignVariantsToProduct(
    productId: string,
    variantIds: string[],
    sortOrder: number[] = []
  ): Promise<void> {
    await prisma.productProductVariant.deleteMany({ where: { productId } })

    if (variantIds.length > 0) {
      await prisma.productProductVariant.createMany({
        data: variantIds.map((variantId, index) => ({
          id: `${productId}_${variantId}`,
          productId,
          variantId,
          sortOrder: sortOrder[index] ?? index
        }))
      })
    }
  }
}