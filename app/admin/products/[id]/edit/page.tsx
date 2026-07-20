'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  slug: string
  pricePerKg: number | null
  stockGrams: number
  images: string | string[]
  categoryId: string
  category?: { name: string }
  isFeatured: boolean
  isTodayOffer: boolean
  isVisible: boolean
  description?: string
  shortDescription?: string
  productOverview?: string
  whyChoose?: string
  ingredients?: string
  nutritionalInfo?: string
  storageInstructions?: string
  shelfLife?: string
  origin?: string
  benefits?: string
  shippingInfo?: string
  faqs?: {question: string, answer: string}[]
  seoKeywords?: string
  productType?: 'weight' | 'quantity' | 'pack' | 'volume'
  createdAt?: string
  updatedAt?: string
  extension?: {
    basePrice?: number
    stockQuantity?: number
    unitTypeId?: string
    masterUnit?: {
      id: string
      code: string
      name: string
      type: 'weight' | 'quantity' | 'pack' | 'volume'
      symbol?: string
      sortOrder: number
      isActive: boolean
    }
    pricingTemplateId?: string
  }
  productVariants?: { variantId: string }[]
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Variant {
  id: string
  label: string
  unit: { type: string }
}

interface PricingTemplate {
  id: string
  name: string
  slug: string
}

type ProductType = 'weight' | 'quantity' | 'pack' | 'volume'

const DEFAULT_TEMPLATE_ID = 'linear-pricing'

const PRICING_HELP: Record<ProductType, string> = {
  weight: 'Variant prices are calculated from the 1kg base price.',
  quantity: 'Variant prices are calculated from the price of one piece.',
  pack: 'Variant prices are calculated from the price of one pack.',
  volume: 'Variant prices are calculated from the price of one litre.'
}

const PRODUCT_TYPE_UNITS: Record<ProductType, { priceLabel: string; stockLabel: string; helpText: string; plural: string; color: string }> = {
  weight: {
    priceLabel: 'Base Price Per KG (Rs)',
    stockLabel: 'Total Stock (kg)',
    helpText: 'Converted to grams internally',
    plural: 'kg',
    color: 'bg-blue-100 text-blue-800'
  },
  quantity: {
    priceLabel: 'Base Price Per Piece (Rs)',
    stockLabel: 'Available Pieces',
    helpText: '',
    plural: 'pieces',
    color: 'bg-green-100 text-green-800'
  },
  pack: {
    priceLabel: 'Base Price Per Pack (Rs)',
    stockLabel: 'Available Packs',
    helpText: '',
    plural: 'packs',
    color: 'bg-purple-100 text-purple-800'
  },
  volume: {
    priceLabel: 'Base Price Per Litre (Rs)',
    stockLabel: 'Available Litres',
    helpText: '',
    plural: 'litres',
    color: 'bg-orange-100 text-orange-800'
  }
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f3f4f6"/><text x="50" y="55" font-size="14" text-anchor="middle" fill="#9ca3af">?</text></svg>')

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    pricePerKg: '',
    stockKg: '',
    stockQuantity: '',
    images: [] as string[],
    categoryId: '',
    productType: 'weight' as ProductType,
    isFeatured: false,
    isTodayOffer: false,
    isVisible: true,
    productOverview: '',
    whyChoose: '',
    ingredients: '',
    nutritionalInfo: '',
    storageInstructions: '',
    shelfLife: '',
    origin: '',
    benefits: '',
    shippingInfo: '',
    faqs: [] as {question: string, answer: string}[],
    seoKeywords: '',
    variantIds: [] as string[],
    pricingTemplateId: DEFAULT_TEMPLATE_ID
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes, variantsRes, templatesRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch('/api/admin/categories'),
          fetch('/api/admin/variants'),
          fetch('/api/admin/pricing-templates')
        ])
        
        if (productRes.ok) {
          const prod = await productRes.json()
          setProduct(prod)
          
          const productType = prod.extension?.masterUnit?.type || 'weight'
          const basePrice = prod.extension?.basePrice || prod.pricePerKg || 0
          
          let loadedImages: string[] = []
          try {
            if (Array.isArray(prod.images)) {
              loadedImages = prod.images
            } else if (typeof prod.images === 'string') {
              loadedImages = JSON.parse(prod.images)
            }
          } catch {
            loadedImages = typeof prod.images === 'string' ? [prod.images] : []
          }
          
          const existingVariantIds = prod.productVariants?.map((pv: any) => pv.variantId) || []
          
          setFormData({
            name: prod.name,
            slug: prod.slug,
            description: prod.description || '',
            shortDescription: prod.shortDescription || '',
            pricePerKg: productType === 'weight' ? (prod.pricePerKg?.toString() || '') : basePrice.toString(),
            stockKg: (prod.stockGrams / 1000).toFixed(2),
            stockQuantity: prod.extension?.stockQuantity?.toString() || '',
            images: loadedImages,
            categoryId: prod.categoryId,
            productType: productType,
            isFeatured: prod.isFeatured || false,
            isTodayOffer: prod.isTodayOffer || false,
            isVisible: prod.isVisible !== false,
            productOverview: prod.productOverview || '',
            whyChoose: prod.whyChoose || '',
            ingredients: prod.ingredients || '',
            nutritionalInfo: prod.nutritionalInfo || '',
            storageInstructions: prod.storageInstructions || '',
            shelfLife: prod.shelfLife || '',
            origin: prod.origin || '',
            benefits: prod.benefits || '',
            shippingInfo: prod.shippingInfo || '',
            faqs: Array.isArray(prod.faqs)
              ? prod.faqs
              : (prod.faqs && typeof prod.faqs === 'string' ? JSON.parse(prod.faqs) : []),
            seoKeywords: prod.seoKeywords || '',
            variantIds: existingVariantIds,
            pricingTemplateId: prod.pricingTemplateId || prod.extension?.pricingTemplateId || DEFAULT_TEMPLATE_ID
          })
        }
        
        if (categoriesRes.ok) setCategories(await categoriesRes.json())
        if (variantsRes.ok) setVariants(await variantsRes.json())
        if (templatesRes.ok) setPricingTemplates(await templatesRes.json())
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formDataUpload = new FormData()
    formDataUpload.append('image', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (res.ok) {
        const { imageUrl } = await res.json()
        setFormData(prev => {
          const newImages = [...prev.images]
          newImages[index] = imageUrl
          return { ...prev, images: newImages }
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  const currentStock = formData.productType === 'weight' 
    ? formData.stockKg 
    : formData.stockQuantity

  const saveProduct = async () => {
    setSaving(true)
    try {
      const stockGrams = formData.productType === 'weight'
        ? (parseFloat(formData.stockKg) || 0) * 1000
        : 0

      const data = {
        ...formData,
        pricePerKg: formData.productType === 'weight' ? (parseFloat(formData.pricePerKg) || null) : null,
        stockGrams,
        stockQuantity: formData.productType === 'weight' ? undefined : (parseFloat(formData.stockQuantity) || 0),
        basePrice: formData.pricePerKg,
        images: Array.isArray(formData.images) ? formData.images.filter(Boolean) : [],
        categoryId: formData.categoryId,
        isFeatured: formData.isFeatured,
        isTodayOffer: formData.isTodayOffer,
        isVisible: formData.isVisible !== false,
        productOverview: formData.productOverview,
        whyChoose: formData.whyChoose,
        ingredients: formData.ingredients,
        nutritionalInfo: formData.nutritionalInfo,
        storageInstructions: formData.storageInstructions,
        shelfLife: formData.shelfLife,
        origin: formData.origin,
        benefits: formData.benefits,
        shippingInfo: formData.shippingInfo,
        faqs: formData.faqs,
        seoKeywords: formData.seoKeywords,
        variantIds: formData.variantIds,
        pricingTemplateId: formData.pricingTemplateId || null
      }

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        router.push('/admin/products')
      } else {
        const err = await res.json().catch(() => ({}))
        alert('Failed to save: ' + (err.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Something went wrong while saving the product.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProduct()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse bg-gray-200 h-10 rounded mb-4"></div>
        <div className="animate-pulse bg-gray-200 h-40 rounded mb-4"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6">
        <p className="text-red-600">Product not found</p>
        <button 
          onClick={() => router.push('/admin/products')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => router.push('/admin/products')}
          className="text-blue-600 hover:underline"
        >
          ← Back to Products
        </button>
        <button
          type="button"
          onClick={saveProduct}
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Edit Product: {product.name}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="sticky top-4 bg-white p-4 rounded-lg shadow border border-gray-200 mb-6 -mt-4 z-10">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Quick Actions:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveProduct}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm font-medium"
              >
                {saving ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Product Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Premium Almonds"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  const autoSlug = name
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                  setFormData(prev => ({
                    ...prev,
                    name,
                    slug: autoSlug || prev.slug
                  }))
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <input
                type="text"
                value={formData.slug}
                readOnly
                className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-3 text-gray-600"
              />
              <p className="text-xs text-green-600 mt-1">Automatically cleaned from the product name.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
              <select
                value={formData.productType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  productType: e.target.value as ProductType,
                  variantIds: [],
                  pricingTemplateId: DEFAULT_TEMPLATE_ID
                }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              >
                <option value="weight">Weight</option>
                <option value="quantity">Quantity</option>
                <option value="pack">Pack</option>
                <option value="volume">Volume</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Template</label>
              <select
                value={formData.pricingTemplateId}
                onChange={(e) => setFormData(prev => ({ ...prev, pricingTemplateId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              >
                <option value="none">No pricing template (use base price)</option>
                {pricingTemplates.map((template: PricingTemplate) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Pricing templates define how variant prices are calculated from the base price</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                placeholder="Brief description"
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Full product description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Base Price & Stock
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {PRODUCT_TYPE_UNITS[formData.productType].priceLabel}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="800"
                value={formData.pricePerKg}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePerKg: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                required
              />
              {formData.productType === 'weight' ? (
                <p className="text-xs text-gray-500 mt-1">Variant prices are calculated from the 1kg base price.</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">{PRICING_HELP[formData.productType]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {PRODUCT_TYPE_UNITS[formData.productType].stockLabel} *
              </label>
              <input
                type="number"
                placeholder={formData.productType === 'weight' ? '50' : '10000'}
                value={currentStock}
                onChange={(e) => {
                  if (formData.productType === 'weight') {
                    setFormData(prev => ({ ...prev, stockKg: e.target.value }))
                  } else {
                    setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                required
              />
              {formData.productType === 'weight' && (
                <p className="text-xs text-gray-500 mt-1">Converted to grams internally</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Variants</h3>
          <p className="text-sm text-gray-600 mb-3">Assign variants from the master variant list. Variants determine available sizes/quantities for this product.</p>
          {variants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {variants
                .filter((variant: Variant) => variant.unit?.type === formData.productType)
                .map((variant: Variant) => (
                <label key={variant.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.variantIds.includes(variant.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ 
                          ...prev, 
                          variantIds: [...prev.variantIds, variant.id] 
                        }))
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          variantIds: prev.variantIds.filter(id => id !== variant.id) 
                        }))
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{variant.label}</div>
                    <div className="text-xs text-gray-500">{variant.unit?.type}</div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No variants available. <a href="/admin/variants" className="text-yellow-600 hover:underline">Manage variants</a></p>
          )}
          <p className="text-xs text-gray-500 mt-2">Selected variants will be available for customers to choose from.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Photos (up to 3)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center">
                <label className="block text-sm font-medium mb-2 text-gray-600">Photo {index + 1}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, index)}
                  className="block w-full text-sm mb-3"
                />
                {formData.images[index] ? (
                  <img
                    src={formData.images[index]}
                    alt={`Preview ${index + 1}`}
                    className="mx-auto h-24 w-24 object-cover rounded-xl border"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                  />
                ) : (
                  <div className="h-24 w-24 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">First photo is used as the main image on the website.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Overview</label>
              <textarea
                placeholder="Brief overview of the product..."
                value={formData.productOverview}
                onChange={(e) => setFormData(prev => ({ ...prev, productOverview: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Why Choose This Product</label>
              <textarea
                placeholder="Key reasons to choose this product..."
                value={formData.whyChoose}
                onChange={(e) => setFormData(prev => ({ ...prev, whyChoose: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
              <textarea
                placeholder="List of ingredients..."
                value={formData.ingredients}
                onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nutritional Information</label>
              <textarea
                placeholder="Nutritional details..."
                value={formData.nutritionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life</label>
              <input
                type="text"
                placeholder="e.g. 12 months"
                value={formData.shelfLife}
                onChange={(e) => setFormData(prev => ({ ...prev, shelfLife: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
              <input
                type="text"
                placeholder="e.g. Andhra Pradesh, India"
                value={formData.origin}
                onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
              <textarea
                placeholder="Health and taste benefits..."
                value={formData.benefits}
                onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Instructions</label>
              <textarea
                placeholder="How to store the product..."
                value={formData.storageInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, storageInstructions: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Info</label>
              <textarea
                placeholder="Shipping details..."
                value={formData.shippingInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingInfo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">FAQ</h3>
          <div className="space-y-3">
            {formData.faqs.map((faq, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => {
                    const newFaqs = [...formData.faqs]
                    newFaqs[idx].question = e.target.value
                    setFormData(prev => ({ ...prev, faqs: newFaqs }))
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => {
                    const newFaqs = [...formData.faqs]
                    newFaqs[idx].answer = e.target.value
                    setFormData(prev => ({ ...prev, faqs: newFaqs }))
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, {question: '', answer: ''}] }))}
              className="mt-2 text-sm text-yellow-600 hover:text-yellow-700"
            >
              + Add FAQ
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
          <input
            type="text"
            placeholder="comma, separated, keywords"
            value={formData.seoKeywords}
            onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3"
          />
          <p className="text-xs text-gray-500 mt-1">Enter keywords separated by commas</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Display Options</h3>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Featured Product</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isTodayOffer}
                onChange={(e) => setFormData(prev => ({ ...prev, isTodayOffer: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Today's Offer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Visible on Site</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-8 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}