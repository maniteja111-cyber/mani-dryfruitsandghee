import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProductService } from '@/app/services/product.service'
import { VariantService } from '@/app/services/variant.service'

interface ImportResponse {
  success: boolean
  imported: number
  failed: number
  skipped: number
  errors: { row: number; message: string }[]
}

const BATCH_SIZE = 50

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json() as { rows: Record<string, any>[] }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: false,
        imported: 0,
        failed: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'No products provided' }]
      }, { status: 400 })
    }

    const allUnits = await prisma.masterUnit.findMany({
      where: { isActive: true }
    })

    const unitTypeMap: Record<string, string | undefined> = {
      weight: allUnits.find(u => u.code === 'g')?.id,
      quantity: allUnits.find(u => u.code === 'piece')?.id,
      pack: allUnits.find(u => u.code === 'pack')?.id,
      volume: allUnits.find(u => u.code === 'liter')?.id
    }

    const ALLOWED_PRODUCT_TYPES = ['weight', 'quantity', 'pack', 'volume']

    let imported = 0
    let failed = 0
    let skipped = 0
    const errors: { row: number; message: string }[] = []

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2
        const row = batch[j]

        try {
          const name = String(row.name || '').trim()
          const slug = String(row.slug || '').trim()
          const category = String(row.category || '').trim()
          const productType = String(row.productType || '').toLowerCase().trim()
          const basePrice = row.basePrice ? parseFloat(String(row.basePrice)) : null
          const stockKg = row.stockKg ? parseFloat(String(row.stockKg)) : 0
          const pricePerKg = row.pricePerKg ? parseFloat(String(row.pricePerKg)) : null
          const stockQuantity = row.stockQuantity ? parseFloat(String(row.stockQuantity)) : 0

          if (!name || !category || !productType) {
            errors.push({ row: rowIndex, message: 'Missing required field: name, category, or productType' })
            failed++
            continue
          }

          if (!ALLOWED_PRODUCT_TYPES.includes(productType)) {
            errors.push({ row: rowIndex, message: `Invalid productType. Must be one of: ${ALLOWED_PRODUCT_TYPES.join(', ')}` })
            failed++
            continue
          }

          const categorySlug = category.toLowerCase().replace(/[^a-z0-9\s]+/g, '').replace(/\s+/g, '-')
          const categoryRecord = await prisma.category.findUnique({
            where: { slug: categorySlug }
          })

          let categoryId: string
          if (!categoryRecord) {
            const newCategory = await prisma.category.create({
              data: {
                name: category,
                slug: categorySlug,
                description: `Auto-created category: ${category}`
              }
            })
            categoryId = newCategory.id
          } else {
            categoryId = categoryRecord.id
          }

          const unitTypeId = unitTypeMap[productType]
          if (!unitTypeId) {
            errors.push({ row: rowIndex, message: `No unit found for productType "${productType}"` })
            failed++
            continue
          }

          let pricingTemplateId: string | null = null
          if (row.pricingTemplate?.trim()) {
            const template = await prisma.pricingTemplate.findFirst({
              where: {
                OR: [
                  { name: String(row.pricingTemplate).trim() },
                  { slug: String(row.pricingTemplate).trim() }
                ]
              }
            })
            if (template) {
              pricingTemplateId = template.id
            }
          }

          let variantIds: string[] = []
          if (row.variants?.trim()) {
            const variantLabels = String(row.variants).split(',').map((v: string) => v.trim()).filter((v: string) => v)
            if (variantLabels.length > 0) {
              const allVariants = await VariantService.getAllActiveVariants()
              const unitVariants = allVariants.filter((v: any) => v.unit.type === productType)
              const labelToId = new Map(unitVariants.map((v: any) => [v.label, v.id]))

              for (const label of variantLabels) {
                const variantId = labelToId.get(label)
                if (variantId) {
                  variantIds.push(variantId)
                }
              }
            }
          }

          let images: string[] = []
          if (row.images?.trim()) {
            try {
              const parsedImages = JSON.parse(String(row.images))
              if (Array.isArray(parsedImages)) {
                for (const img of parsedImages) {
                  if (typeof img === 'string' && /^https?:\/\/.+/.test(img)) {
                    images.push(img)
                  }
                }
              }
            } catch {
              images = []
            }
          }

          let faqs: { question: string; answer: string }[] = []
          if (row.faqs?.trim()) {
            try {
              faqs = JSON.parse(String(row.faqs))
            } catch {
              faqs = []
            }
          }

          const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

          const stockGrams = stockKg ? Math.round(parseFloat(String(stockKg)) * 1000) : 0

          await ProductService.createProduct({
            name,
            slug: finalSlug,
            description: row.description,
            shortDescription: row.shortDescription,
            categoryId,
            images,
            pricePerKg,
            stockGrams,
            unitTypeId,
            basePrice,
            pricingTemplateId,
            stockQuantity,
            faqs,
            ingredients: row.ingredients,
            benefits: row.benefits,
            storageInstructions: row.storageInstructions,
            shelfLife: row.shelfLife,
            origin: row.origin,
            nutritionalInfo: row.nutritionalInfo,
            shippingInfo: row.shippingInfo,
            whyChoose: row.whyChoose,
            productOverview: row.productOverview,
            seoKeywords: row.seoKeywords,
            isFeatured: row.isFeatured ?? false,
            isTodayOffer: row.isTodayOffer ?? false,
            isVisible: row.isVisible !== false,
            variantIds
          })

          imported++

        } catch (error: any) {
          console.error(`Import error row ${rowIndex}:`, error)
          errors.push({ row: rowIndex, message: error.message || 'Unknown error' })
          failed++
        }
      }
    }

    return NextResponse.json({
      success: failed === 0,
      imported,
      failed,
      skipped,
      errors
    })

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [{ row: 0, message: 'Internal server error during import' }]
    }, { status: 500 })
  }
}