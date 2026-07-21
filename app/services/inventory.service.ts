import { prisma } from '@/lib/prisma'

export interface InventoryCheck {
  available: boolean
  availableQuantity: number
  requestedQuantity: number
  message: string
}

export class InventoryService {
  static async checkAvailability(
    productId: string,
    quantity: number,
    unitType: string,
    variantGrams: number = 0
  ): Promise<InventoryCheck> {
    try {
      const [product, extension] = await Promise.all([
        prisma.product.findUnique({ where: { id: productId } }),
        prisma.productExtension.findUnique({ where: { productId } })
      ])

      if (!product) {
        return {
          available: false,
          availableQuantity: 0,
          requestedQuantity: quantity,
          message: 'Product not found'
        }
      }

      let availableQuantity = 0

      if (unitType === 'weight' || unitType === 'g') {
        availableQuantity = extension?.stockQuantity ?? product.stockGrams
      } else if (unitType === 'piece' || unitType === 'quantity') {
        availableQuantity = extension?.stockQuantity ?? 0
      }

      const totalRequested = unitType === 'weight' || unitType === 'g'
        ? variantGrams * quantity
        : quantity

      const isAvailable = totalRequested <= availableQuantity

      return {
        available: isAvailable,
        availableQuantity,
        requestedQuantity: totalRequested,
        message: isAvailable
          ? 'In stock'
          : `Only ${unitType === 'weight' || unitType === 'g' ? `${(availableQuantity / 1000).toFixed(2)}kg` : availableQuantity} available`
      }
    } catch (error) {
      console.error('Inventory check error:', error)
      return {
        available: false,
        availableQuantity: 0,
        requestedQuantity: quantity,
        message: 'Unable to check availability'
      }
    }
  }

  static async deductInventory(
    productId: string,
    quantity: number,
    unitType: string,
    variantGrams: number = 0
  ): Promise<boolean> {
    try {
      const deduction = unitType === 'weight' || unitType === 'g'
        ? variantGrams * quantity
        : quantity

      if (deduction <= 0) return true

      if (unitType === 'weight' || unitType === 'g') {
        const result = await prisma.$executeRaw`
          UPDATE product_extensions 
          SET stockQuantity = stockQuantity - ${deduction}
          WHERE productId = ${productId} AND stockQuantity >= ${deduction}
        `
        if (result > 0) return true

        const legacyResult = await prisma.$executeRaw`
          UPDATE products 
          SET stockGrams = stockGrams - ${deduction}
          WHERE id = ${productId} AND stockGrams >= ${deduction}
        `
        return legacyResult > 0
      } else {
        const result = await prisma.$executeRaw`
          UPDATE product_extensions 
          SET stockQuantity = stockQuantity - ${deduction}
          WHERE productId = ${productId} AND stockQuantity >= ${deduction}
        `
        if (result > 0) return true

        return false
      }
    } catch (error) {
      console.error('Deduct inventory error:', error)
      return false
    }
  }

  static async getStockInfo(productId: string): Promise<{
    stockGrams: number
    stockQuantity: number
    unitType: string
  }> {
    try {
      const [product, extension] = await Promise.all([
        prisma.product.findUnique({ where: { id: productId } }),
        prisma.productExtension.findUnique({ where: { productId } })
      ])

      if (!product) {
        return { stockGrams: 0, stockQuantity: 0, unitType: 'g' }
      }

      return {
        stockGrams: product.stockGrams,
        stockQuantity: extension?.stockQuantity ?? 0,
        unitType: extension?.unitTypeId ?? 'g'
      }
    } catch (error) {
      console.error('Get stock info error:', error)
      return { stockGrams: 0, stockQuantity: 0, unitType: 'g' }
    }
  }

  static async adjustStock(
    productId: string,
    adjustment: number,
    unitType: string
  ): Promise<boolean> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) return false

      const extension = await prisma.productExtension.findUnique({
        where: { productId }
      })

      if (extension) {
        await prisma.productExtension.update({
          where: { productId },
          data: { stockQuantity: Math.max(0, (extension.stockQuantity || 0) + adjustment) }
        })
      } else {
        await prisma.product.update({
          where: { id: productId },
          data: { stockGrams: Math.max(0, product.stockGrams + adjustment) }
        })
      }

      return true
    } catch (error) {
      console.error('Adjust stock error:', error)
      return false
    }
  }
}