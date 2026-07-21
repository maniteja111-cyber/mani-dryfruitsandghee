import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, errors: [{ row: 0, column: 'file', message: 'No file uploaded' }] }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ success: false, errors: [{ row: 0, column: 'file', message: 'Only .xlsx files are supported' }] }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = require('xlsx').read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = require('xlsx').utils.sheet_to_json(worksheet)

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [{ row: 0, column: 'file', message: 'Excel file is empty' }],
        parsedData: []
      }, { status: 400 })
    }

    if (rows.length > 1000) {
      return NextResponse.json({
        success: false,
        totalRows: rows.length,
        validRows: 0,
        invalidRows: rows.length,
        errors: [{ row: 0, column: 'file', message: 'Maximum 1000 rows allowed per upload' }],
        parsedData: []
      }, { status: 400 })
    }

    const allErrors: ValidationError[] = []
    const seenNames = new Set<string>()
    const seenSlugs = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const rowErrors = await validateRow(rows[i], i, seenNames, seenSlugs)
      allErrors.push(...rowErrors)
    }

    const rowsWithErrors = new Set(allErrors.map(e => e.row))
    const validRows = rows.length - rowsWithErrors.size
    const invalidRows = rowsWithErrors.size

    return NextResponse.json({
      success: invalidRows === 0,
      totalRows: rows.length,
      validRows,
      invalidRows,
      errors: allErrors,
      parsedData: rows
    })

  } catch (error) {
    console.error('Bulk upload validation error:', error)
    return NextResponse.json({
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 0, column: 'server', message: 'Internal server error during validation' }],
      parsedData: []
    }, { status: 500 })
  }
}

import { prisma } from '@/lib/prisma'
import { VariantService } from '@/app/services/variant.service'

interface ValidationError {
  row: number
  column: string
  message: string
}

interface ValidationResponse {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  errors: ValidationError[]
  parsedData?: any[]
}

const REQUIRED_FIELDS = ['name', 'category', 'productType']

const ALLOWED_PRODUCT_TYPES = ['weight', 'quantity', 'pack', 'volume']

async function validateRow(
  row: Record<string, any>,
  rowIndex: number,
  seenNames: Set<string>,
  seenSlugs: Set<string>
): Promise<ValidationError[]> {
  const errors: ValidationError[] = []
  const rowNum = rowIndex + 2

  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || String(row[field]).trim() === '') {
      errors.push({ row: rowNum, column: field, message: `${field} is required` })
    }
  }

  const name = String(row.name || '').trim()
  const slug = String(row.slug || '').trim()

  if (name) {
    if (seenNames.has(name.toLowerCase())) {
      errors.push({ row: rowNum, column: 'name', message: `Duplicate name "${name}" in Excel` })
    }
    seenNames.add(name.toLowerCase())

    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existingProduct = await prisma.product.findUnique({ where: { slug: generatedSlug } })
    if (existingProduct) {
      errors.push({ row: rowNum, column: 'name', message: `Product with slug "${generatedSlug}" already exists in database` })
    }
  }

  if (slug) {
    if (seenSlugs.has(slug.toLowerCase())) {
      errors.push({ row: rowNum, column: 'slug', message: `Duplicate slug "${slug}" in Excel` })
    }
    seenSlugs.add(slug.toLowerCase())

    const existingBySlug = await prisma.product.findUnique({ where: { slug } })
    if (existingBySlug) {
      errors.push({ row: rowNum, column: 'slug', message: `Slug "${slug}" already exists in database` })
    }
  }

  if (row.category) {
    const categorySlug = String(row.category).trim().toLowerCase().replace(/[^a-z0-9\s]+/g, '').replace(/\s+/g, '-')
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
    if (!category) {
      const categoryName = String(row.category).trim()
      try {
        await prisma.category.create({
          data: {
            name: categoryName,
            slug: categorySlug,
            description: `Auto-created category: ${categoryName}`
          }
        })
      } catch (e) {
        errors.push({ row: rowNum, column: 'category', message: `Category "${row.category}" not found and could not be created` })
      }
    }
  }

  const productType = String(row.productType || '').toLowerCase().trim()
  if (productType && !ALLOWED_PRODUCT_TYPES.includes(productType as any)) {
    errors.push({ row: rowNum, column: 'productType', message: `Invalid productType. Must be one of: ${ALLOWED_PRODUCT_TYPES.join(', ')}` })
  }

  const validateNonNegative = (value: any, fieldName: string) => {
    if (value !== undefined && value !== '') {
      const num = parseFloat(String(value))
      if (isNaN(num) || num < 0) {
        errors.push({ row: rowNum, column: fieldName, message: `${fieldName} must be a non-negative number` })
      }
    }
  }

  validateNonNegative(row.pricePerKg, 'pricePerKg')
  validateNonNegative(row.basePrice, 'basePrice')
  validateNonNegative(row.stockKg, 'stockKg')
  validateNonNegative(row.stockQuantity, 'stockQuantity')

  if (row.images) {
    const imagesStr = String(row.images).trim()
    if (imagesStr) {
      try {
        const images = JSON.parse(imagesStr)
        if (!Array.isArray(images)) {
          errors.push({ row: rowNum, column: 'images', message: 'images must be a JSON array' })
        } else {
          for (const img of images) {
            if (typeof img !== 'string') {
              errors.push({ row: rowNum, column: 'images', message: `Invalid image value: expected string, got ${typeof img}` })
            } else if (!/^https?:\/\/.+/.test(img)) {
              errors.push({ row: rowNum, column: 'images', message: `Invalid image URL "${img}" - must start with http:// or https://` })
            }
          }
        }
      } catch (e) {
        errors.push({ row: rowNum, column: 'images', message: `images must be valid JSON array, got: "${imagesStr}"` })
      }
    }
  }

  if (row.pricingTemplate) {
    const templateName = String(row.pricingTemplate).trim()
    const template = await prisma.pricingTemplate.findFirst({
      where: { OR: [{ name: templateName }, { slug: templateName }] }
    })
    if (!template) {
      errors.push({ row: rowNum, column: 'pricingTemplate', message: `Pricing template "${templateName}" not found` })
    }
  }

  if (row.variants) {
    const variantLabels = String(row.variants).split(',').map(v => v.trim()).filter(v => v)
    if (variantLabels.length > 0 && productType) {
      const allVariants = await VariantService.getAllActiveVariants()
      const unitVariants = allVariants.filter(v => v.unit.type === productType)
      const unitLabels = unitVariants.map(v => v.label)

      for (const label of variantLabels) {
        if (!unitLabels.includes(label)) {
          console.log(`Variant "${label}" will be auto-created for productType "${productType}"`)
        }
      }
    }
  }

  if (row.faqs) {
    try {
      const faqs = JSON.parse(String(row.faqs))
      if (!Array.isArray(faqs)) {
        errors.push({ row: rowNum, column: 'faqs', message: 'faqs must be a JSON array' })
      }
    } catch {
      errors.push({ row: rowNum, column: 'faqs', message: 'faqs must be valid JSON array' })
    }
  }

  return errors
}