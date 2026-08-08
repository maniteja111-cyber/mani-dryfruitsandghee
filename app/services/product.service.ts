import { prisma } from '@/lib/prisma'
import { PricingService, VariantPrice } from './pricing.service'
import { InventoryService } from './inventory.service'
import { VariantService } from './variant.service'

export interface CreateProductData {
  name: string
  slug: string
  description?: string
  shortDescription?: string
  categoryId: string
  images: string[]
  pricePerKg?: number | null
  stockGrams?: number
  unitTypeId?: string | null
  basePrice?: number | null
  pricingTemplateId?: string | null
  stockQuantity?: number
  faqs?: { question: string; answer: string }[]
  ingredients?: string
  benefits?: string
  storageInstructions?: string
  shelfLife?: string
  origin?: string
  nutritionalInfo?: string
  shippingInfo?: string
  whyChoose?: string
  productOverview?: string
  seoKeywords?: string
  isFeatured?: boolean
  isTodayOffer?: boolean
  isVisible?: boolean
  variantIds?: string[]
}

export class ProductService {
  static async createProduct(data: CreateProductData): Promise<any> {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        images: JSON.stringify(data.images),
        categoryId: data.categoryId,
        pricePerKg: data.pricePerKg ?? null,
        stockGrams: data.stockGrams ?? 0,
        isFeatured: data.isFeatured ?? false,
        isTodayOffer: data.isTodayOffer ?? false,
        isVisible: data.isVisible ?? true,
        faqs: data.faqs ? JSON.stringify(data.faqs) : null,
        ingredients: data.ingredients,
        benefits: data.benefits,
        storageInstructions: data.storageInstructions,
        shelfLife: data.shelfLife,
        origin: data.origin,
        nutritionalInfo: data.nutritionalInfo,
        shippingInfo: data.shippingInfo,
        whyChoose: data.whyChoose,
        productOverview: data.productOverview,
        seoKeywords: data.seoKeywords
      }
    })

    if (data.unitTypeId) {
      await prisma.productExtension.create({
        data: {
          productId: product.id,
          unitTypeId: data.unitTypeId,
          basePrice: data.basePrice ?? null,
          pricingTemplateId: data.pricingTemplateId ?? null,
          stockQuantity: data.stockQuantity ?? 0
        }
      })
    }

    if (data.variantIds && data.variantIds.length > 0) {
      await VariantService.assignVariantsToProduct(product.id, data.variantIds)
    }

    return product
  }

  static async updateProduct(productId: string, data: Partial<CreateProductData>): Promise<any> {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        images: data.images ? JSON.stringify(data.images) : undefined,
        categoryId: data.categoryId,
        pricePerKg: data.pricePerKg,
        stockGrams: data.stockGrams,
        isFeatured: data.isFeatured,
        isTodayOffer: data.isTodayOffer,
        isVisible: data.isVisible,
        faqs: data.faqs ? JSON.stringify(data.faqs) : undefined,
        ingredients: data.ingredients,
        benefits: data.benefits,
        storageInstructions: data.storageInstructions,
        shelfLife: data.shelfLife,
        origin: data.origin,
        nutritionalInfo: data.nutritionalInfo,
        shippingInfo: data.shippingInfo,
        whyChoose: data.whyChoose,
        productOverview: data.productOverview,
        seoKeywords: data.seoKeywords
      }
    })

    const existingExtension = await prisma.productExtension.findUnique({
      where: { productId }
    })

    if (data.unitTypeId || data.basePrice !== undefined || data.pricingTemplateId || data.stockQuantity !== undefined) {
      if (existingExtension) {
        await prisma.productExtension.update({
          where: { productId },
          data: {
            unitTypeId: data.unitTypeId ?? undefined,
            basePrice: data.basePrice ?? undefined,
            pricingTemplateId: data.pricingTemplateId ?? undefined,
            stockQuantity: data.stockQuantity ?? undefined
          }
        })
      } else if (data.unitTypeId) {
        await prisma.productExtension.create({
          data: {
            productId,
            unitTypeId: data.unitTypeId,
            basePrice: data.basePrice ?? null,
            pricingTemplateId: data.pricingTemplateId ?? null,
            stockQuantity: data.stockQuantity ?? 0
          }
        })
      }
    }

    if (data.variantIds) {
      await VariantService.assignVariantsToProduct(productId, data.variantIds)
    }

    return product
  }

  static async getProductWithVariants(productId: string): Promise<any> {
    const [product, extension] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          productVariants: {
            where: { isActive: true },
            include: {
              variant: {
                include: { unit: true }
              }
            },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }),
      this.tryGetExtension(productId)
    ])

    if (!product) return null
    return { ...product, ...extension }
  }

  static async getProductBySlug(slug: string): Promise<any> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        productVariants: {
          where: { isActive: true },
          include: {
            variant: {
              include: { unit: true }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!product) return null

    const extension = await this.tryGetExtension(product.id)
    return { ...product, ...extension }
  }

  static async tryGetExtension(productId: string): Promise<any> {
    try {
      const [extension, productVariants] = await Promise.all([
        prisma.productExtension.findUnique({
          where: { productId },
          include: {
            masterUnit: true,
            pricingTemplate: true
          }
        }),
        prisma.productProductVariant.findMany({
          where: { productId, isActive: true },
          select: { variantId: true }
        })
      ])

      if (!extension) return {}

      const variantPrices = await PricingService.generateVariantPrices(
        productId,
        extension.basePrice ?? 0,
        extension.pricingTemplateId,
        productVariants.map(pv => pv.variantId)
      )

      return {
        extension: {
          unitTypeId: extension.unitTypeId,
          basePrice: extension.basePrice,
          pricingTemplateId: extension.pricingTemplateId,
          stockQuantity: extension.stockQuantity,
          masterUnit: extension.masterUnit,
          pricingTemplate: extension.pricingTemplate
        },
        variantPrices
      }
    } catch (error) {
      console.error('Try get extension error:', error)
      return {}
    }
  }

  static async listProducts(filters: {
    category?: string
    search?: string
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
  } = {}): Promise<{ products: any[]; total: number; page: number; totalPages: number }> {
    const where: any = {}
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const sort = filters.sort ?? 'createdAt'
    const order = filters.order ?? 'desc'

    if (filters.category) {
      where.categoryId = filters.category
    }
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' }
    }

    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
      include: { category: true }
    })

    const total = await prisma.product.count({ where })

    const productsWithExtensions = await Promise.all(
      products.map(async (product) => {
        try {
          const extension = await prisma.productExtension.findUnique({
            where: { productId: product.id },
            include: {
              masterUnit: true,
              pricingTemplate: true
            }
          })

          const productVariants = await prisma.productProductVariant.findMany({
            where: { productId: product.id, isActive: true },
            select: { variantId: true }
          })

          let variantPrices: VariantPrice[] = []
          if (extension && productVariants.length > 0) {
            variantPrices = await PricingService.generateVariantPrices(
              product.id,
              extension.basePrice ?? 0,
              extension.pricingTemplateId,
              productVariants.map(pv => pv.variantId)
            )
          }

          return {
            ...product,
            extension,
            productVariants: productVariants.map(pv => ({ variantId: pv.variantId })),
            variantPrices
          }
        } catch (error) {
          console.error('Error fetching product extension:', error)
          return {
            ...product,
            extension: null,
            productVariants: [],
            variantPrices: []
          }
        }
      })
    )

    return {
      products: productsWithExtensions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  }

  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      await prisma.productProductVariant.deleteMany({ where: { productId } })
      await prisma.productExtension.deleteMany({ where: { productId } })
      await prisma.product.delete({ where: { id: productId } })
      return true
    } catch {
      return false
    }
  }
}