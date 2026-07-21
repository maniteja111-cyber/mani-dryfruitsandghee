'use client'

import { useState, useEffect } from 'react'

interface ProductRow {
  id: string
  name: string
  slug: string
  category: string
  description: string
  shortDescription: string
  pricePerKg: number
  stockKg: number
  images: string
  basePrice: number
  pricingTemplate: string
  stockQuantity: number
  productType: 'weight' | 'quantity' | 'pack' | 'volume'
  variants: string
  isFeatured: boolean
  isTodayOffer: boolean
  isVisible: boolean
  seoKeywords: string
  faqs: any
  ingredients: string
  benefits: string
  storageInstructions: string
  shelfLife: string
  origin: string
  shippingInfo: string
  whyChoose: string
  productOverview: string
  nutritionalInfo: string
  isValid: boolean
  errors: string[]
  isDuplicate: boolean
  duplicateType: 'name' | 'slug' | null
  existingProductSlug: string | null
  status: 'new' | 'existing' | 'duplicate'
  skip: boolean
}

const PRODUCT_TYPES = [
  { value: 'weight', label: 'Weight', unitLabel: 'kg', plural: 'kg' },
  { value: 'quantity', label: 'Quantity', unitLabel: 'piece', plural: 'pieces' },
  { value: 'pack', label: 'Pack', unitLabel: 'pack', plural: 'packs' },
  { value: 'volume', label: 'Volume', unitLabel: 'litre', plural: 'litres' }
]

interface ProductFormProps {
  row: ProductRow
  categories: { id: string; name: string; slug: string }[]
  pricingTemplates: { id: string; name: string; slug: string }[]
  allVariants: any[]
  onUpdate: (row: ProductRow) => void
  onUploadImage: (index: number, file: File) => void
  getPricingPreview: () => any[] | null
  onValidate: () => void
}

export default function ProductForm({ 
  row, 
  categories, 
  pricingTemplates, 
  allVariants, 
  onUpdate, 
  onUploadImage, 
  getPricingPreview, 
  onValidate 
}: ProductFormProps) {
  const [localRow, setLocalRow] = useState(row)

  useEffect(() => {
    setLocalRow(row)
  }, [row])

  const handleChange = (field: keyof ProductRow, value: any) => {
    const updated = { ...localRow, [field]: value }
    setLocalRow(updated)
    onUpdate(updated)
  }

  const handleBlur = () => {
    onValidate()
  }

  const parseImages = () => {
    try {
      return JSON.parse(localRow.images || '[]')
    } catch {
      return []
    }
  }

  const images = parseImages()

  const parseFaqs = (): { question: string; answer: string }[] => {
    if (!localRow.faqs) return []
    if (typeof localRow.faqs === 'string') {
      try {
        const parsed = JSON.parse(localRow.faqs)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    if (Array.isArray(localRow.faqs)) return localRow.faqs
    return []
  }

  const faqs = parseFaqs()

  const getSelectedCategory = () => {
    if (!localRow.category) return ''
    const foundByName = categories.find(c => c.name === localRow.category)
    if (foundByName) return foundByName.slug
    const foundBySlug = categories.find(c => c.slug === localRow.category)
    if (foundBySlug) return foundBySlug.slug
    return localRow.category
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            value={localRow.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={handleBlur}
            className={`w-full border rounded-lg px-3 py-2 ${!localRow.isValid ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="Premium Almonds"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
          <input
            type="text"
            value={localRow.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="premium-almonds"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={getSelectedCategory()}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price Per KG (Rs) *</label>
          <input
            type="number"
            value={localRow.pricePerKg}
            onChange={(e) => handleChange('pricePerKg', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder={localRow.productType === 'weight' ? '800' : '0'}
            required
          />
          {localRow.productType !== 'weight' && (
            <p className="text-xs text-gray-500 mt-1">For non-weight products, use Base Price instead</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock ({localRow.productType === 'weight' ? 'kg' : localRow.productType === 'quantity' ? 'pieces' : localRow.productType === 'pack' ? 'packs' : 'litres'}) *</label>
          <input
            type="number"
            value={localRow.productType === 'weight' ? localRow.stockKg : localRow.stockQuantity}
            onChange={(e) => {
              if (localRow.productType === 'weight') {
                handleChange('stockKg', parseFloat(e.target.value) || 0)
              } else {
                handleChange('stockQuantity', parseFloat(e.target.value) || 0)
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="10"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
          <select
            value={localRow.productType}
            onChange={(e) => handleChange('productType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {PRODUCT_TYPES.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Rs)</label>
          <input
            type="number"
            value={localRow.basePrice}
            onChange={(e) => handleChange('basePrice', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="750"
          />
          {localRow.productType !== 'weight' && (
            <p className="text-xs text-gray-500 mt-1">Base price for {localRow.productType === 'volume' ? 'litre' : localRow.productType === 'quantity' ? 'piece' : localRow.productType === 'pack' ? 'pack' : 'kg'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Template</label>
          <select
            value={localRow.pricingTemplate}
            onChange={(e) => handleChange('pricingTemplate', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">None</option>
            {pricingTemplates.map(t => (
              <option key={t.id} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extension Stock Qty</label>
          <input
            type="number"
            value={localRow.stockQuantity}
            onChange={(e) => handleChange('stockQuantity', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variants</label>
          <select
            multiple
            value={localRow.variants.split(',').filter(Boolean)}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, o => o.value)
              handleChange('variants', options.join(','))
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            size={4}
          >
            {allVariants.filter(v => v.unit.type === localRow.productType).map(v => (
              <option key={v.id} value={v.label}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Photos (up to 3)</label>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
              <label className="block text-xs text-gray-600 mb-2">Photo {index + 1}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUploadImage(index, file)
                }}
                className="block w-full text-sm mb-2"
              />
              {images[index] && (
                <img src={images[index]} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
        <textarea
          value={localRow.shortDescription}
          onChange={(e) => handleChange('shortDescription', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={localRow.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords</label>
        <input
          type="text"
          value={localRow.seoKeywords}
          onChange={(e) => handleChange('seoKeywords', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="almonds, nuts, dry fruits"
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Display Options</h4>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localRow.isFeatured}
              onChange={(e) => handleChange('isFeatured', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localRow.isTodayOffer}
              onChange={(e) => handleChange('isTodayOffer', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Today's Offer</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localRow.isVisible}
              onChange={(e) => handleChange('isVisible', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Visible</span>
          </label>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Overview</label>
            <textarea
              placeholder="Brief overview of the product..."
              value={localRow.productOverview}
              onChange={(e) => handleChange('productOverview', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why Choose This Product</label>
            <textarea
              placeholder="Key reasons to choose this product..."
              value={localRow.whyChoose}
              onChange={(e) => handleChange('whyChoose', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
            <textarea
              placeholder="List of ingredients..."
              value={localRow.ingredients}
              onChange={(e) => handleChange('ingredients', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nutritional Information</label>
            <textarea
              placeholder="Nutritional details..."
              value={localRow.nutritionalInfo}
              onChange={(e) => handleChange('nutritionalInfo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life</label>
            <input
              type="text"
              placeholder="e.g. 12 months"
              value={localRow.shelfLife}
              onChange={(e) => handleChange('shelfLife', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
            <input
              type="text"
              placeholder="e.g. Andhra Pradesh, India"
              value={localRow.origin}
              onChange={(e) => handleChange('origin', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
            <textarea
              placeholder="Health and taste benefits..."
              value={localRow.benefits}
              onChange={(e) => handleChange('benefits', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Instructions</label>
            <textarea
              placeholder="How to store the product..."
              value={localRow.storageInstructions}
              onChange={(e) => handleChange('storageInstructions', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Info</label>
            <textarea
              placeholder="Shipping details..."
              value={localRow.shippingInfo}
              onChange={(e) => handleChange('shippingInfo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">FAQ</h3>
        <div className="space-y-3">
          {faqs.map((faq: { question: string; answer: string }, idx: number) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Question"
                value={faq.question}
                onChange={(e) => {
                  const newFaqs = [...faqs]
                  newFaqs[idx] = { ...newFaqs[idx], question: e.target.value }
                  handleChange('faqs', newFaqs)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => {
                  const newFaqs = [...faqs]
                  newFaqs[idx] = { ...newFaqs[idx], answer: e.target.value }
                  handleChange('faqs', newFaqs)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleChange('faqs', [...faqs, { question: '', answer: '' }])}
            className="text-sm text-yellow-600 hover:underline"
          >
            + Add FAQ
          </button>
        </div>
      </div>
    </div>
  )
}