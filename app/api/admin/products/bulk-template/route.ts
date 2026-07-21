import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const data = [
    {
      name: 'Premium Almonds',
      slug: 'premium-almonds',
      category: 'Dry Fruits',
      description: 'High quality almonds sourced from California',
      shortDescription: 'Premium California almonds',
      pricePerKg: 800,
      stockKg: 13,
      images: '["https://example.com/image1.jpg","https://example.com/image2.jpg"]',
      isFeatured: true,
      isTodayOffer: false,
      isVisible: true,
      basePrice: 800,
      pricingTemplate: 'Standard Weight Pricing',
      stockQuantity: 0,
      productType: 'weight',
      variants: '125g,250g,500g,1kg',
      productOverview: 'Premium quality almonds for daily consumption',
      whyChoose: 'Rich in nutrients and protein',
      ingredients: 'Almonds',
      benefits: 'Good for heart health',
      storageInstructions: 'Store in airtight container',
      shelfLife: '12 months',
      origin: 'California, USA',
      shippingInfo: 'Ships within 2-3 business days',
      seoKeywords: 'almonds, nuts, dry fruits, california',
      faqs: '[{"question":"How to store?","answer":"Store in cool dry place"}]'
    },
    {
      name: 'Organic Cashews',
      slug: 'organic-cashews',
      category: 'Dry Fruits',
      description: 'Organic cashews from Kerala',
      shortDescription: 'Organic Kerala cashews',
      pricePerKg: 0,
      stockKg: 25,
      images: '["https://example.com/cashew1.jpg"]',
      isFeatured: false,
      isTodayOffer: true,
      isVisible: true,
      basePrice: 950,
      pricingTemplate: 'Standard Weight Pricing',
      stockQuantity: 0,
      productType: 'weight',
      variants: '100g,125g,250g,500g,1kg',
      productOverview: 'Organic cashews from Kerala',
      whyChoose: 'Farm fresh organic nuts',
      ingredients: 'Organic Cashews',
      benefits: 'Rich in antioxidants',
      storageInstructions: 'Refrigerate after opening',
      shelfLife: '6 months',
      origin: 'Kerala, India',
      shippingInfo: 'Ships within 1-2 business days',
      seoKeywords: 'cashews, organic nuts, kerala',
      faqs: '[]'
    },
    {
      name: 'Mixed Nuts Gift Pack',
      slug: 'mixed-nuts-gift-pack',
      category: 'Gift Boxes',
      description: 'Premium mixed nuts in attractive packaging',
      shortDescription: 'Gift pack of assorted nuts',
      pricePerKg: 0,
      stockKg: 50,
      images: '["https://example.com/gift1.jpg","https://example.com/gift2.jpg"]',
      isFeatured: true,
      isTodayOffer: false,
      isVisible: true,
      basePrice: 499,
      pricingTemplate: '',
      stockQuantity: 100,
      productType: 'pack',
      variants: '',
      productOverview: 'Perfect gift for any occasion',
      whyChoose: 'Premium packaging with assorted nuts',
      ingredients: 'Almonds, Cashews, Pistachios, Walnuts',
      benefits: 'Healthy snacking gift',
      storageInstructions: 'Store in cool dry place',
      shelfLife: '6 months',
      origin: 'Multiple Origins',
      shippingInfo: 'Free shipping on all orders',
      seoKeywords: 'gift pack, mixed nuts, dry fruits gift',
      faqs: '[]'
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="bulk-products-template.xlsx"'
    }
  })
}