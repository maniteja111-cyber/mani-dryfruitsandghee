'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discountPrice?: number
  stock: number
  category: { name: string }
  isFeatured: boolean
  isTodayOffer: boolean
  isVisible: boolean
  productOverview?: string
  whyChoose?: string
  ingredients?: string
  storageInstructions?: string
  healthBenefits?: string
  shippingInfo?: string
  faqs?: {question: string, answer: string}[]
  seoKeywords?: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    stock: '',
    images: [] as string[],
    categoryId: '',
    measurementType: 'quantity' as 'quantity' | 'weight',
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
    seoKeywords: ''
  })

  // User-friendly variants editor
  const [variants, setVariants] = useState<Array<{
    size: string
    price: string
    discountPrice: string
    weightGrams?: string     // for weight products
    pieces?: string          // for quantity products
  }>>([])
  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ])
      if (productsRes.ok) setProducts(await productsRes.json())
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // Load products + categories when the page opens
  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert friendly variant rows into clean array for database
      const cleanVariants = variants
        .filter(v => v.size && v.price)
        .map(v => {
          const base = {
            size: v.size.trim(),
            price: parseFloat(v.price),
            ...(v.discountPrice && { discountPrice: parseFloat(v.discountPrice) })
          }

          if (formData.measurementType === 'weight' && v.weightGrams) {
            return { ...base, weightGrams: parseInt(v.weightGrams) }
          }
          if (formData.measurementType === 'quantity' && v.pieces) {
            return { ...base, pieces: parseInt(v.pieces) }
          }
          return base
        })

      const data = {
        ...formData,
        images: formData.images.filter(Boolean),
        variants: cleanVariants.length > 0 ? cleanVariants : null,
        measurementType: formData.measurementType,
        isFeatured: formData.isFeatured,
        isTodayOffer: formData.isTodayOffer,
        isVisible: formData.isVisible,
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
        seoKeywords: formData.seoKeywords
      }

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        fetchData()
        setShowForm(false)
        setEditingProduct(null)
        resetForm()
      } else {
        const err = await res.json().catch(() => ({}))
        alert('Failed to save: ' + (err.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Something went wrong while saving the product.')
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)

    // Properly parse images (they are stored as JSON string in DB)
    let loadedImages: string[] = []
    try {
      if (Array.isArray(product.images)) {
        loadedImages = product.images
      } else if (typeof product.images === 'string') {
        loadedImages = JSON.parse(product.images)
      }
    } catch {
      loadedImages = product.images ? [product.images] : []
    }
    // Ensure we have exactly 3 slots
    while (loadedImages.length < 3) loadedImages.push('')

    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() || '',
      stock: product.stock.toString(),
      images: loadedImages,
      categoryId: product.categoryId,
      measurementType: (product.measurementType as 'quantity' | 'weight') || 'quantity',
      isFeatured: product.isFeatured || false,
      isTodayOffer: product.isTodayOffer || false,
      isVisible: product.isVisible !== false,
      productOverview: product.productOverview || '',
      whyChoose: product.whyChoose || '',
      ingredients: product.ingredients || '',
      nutritionalInfo: product.nutritionalInfo || '',
      storageInstructions: product.storageInstructions || '',
      shelfLife: product.shelfLife || '',
      origin: product.origin || '',
      benefits: product.benefits || '',
      shippingInfo: product.shippingInfo || '',
      faqs: Array.isArray(product.faqs) 
        ? product.faqs 
        : (product.faqs && typeof product.faqs === 'string' ? JSON.parse(product.faqs) : []),
      seoKeywords: product.seoKeywords || ''
    })

    // Load variants into nice editor
    let loadedVariants: any[] = []
    try {
      loadedVariants = Array.isArray(product.variants) ? product.variants : (product.variants ? JSON.parse(product.variants) : [])
    } catch {}
    setVariants(
      loadedVariants.length > 0
        ? loadedVariants.map((v: any) => ({
            size: v.size || '',
            price: (v.price || '').toString(),
            discountPrice: v.discountPrice ? v.discountPrice.toString() : '',
            weightGrams: v.weightGrams ? v.weightGrams.toString() : '',
            pieces: v.pieces ? v.pieces.toString() : ''
          }))
        : []
    )

    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchData()
        }
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

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

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      price: '',
      discountPrice: '',
      stock: '',
      images: ['', '', ''],
      categoryId: '',
      measurementType: 'quantity',
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
      faqs: [],
      seoKeywords: ''
    })
    setVariants([])
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false)
              setEditingProduct(null)
              resetForm()
            } else {
              setShowForm(true)
            }
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
        >
          {showForm ? 'Close Form' : '+ Add New Product'}
        </button>
      </div>
        {showForm && (
          <div className="bg-white p-6 rounded-2xl shadow mb-8 border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingProduct(null); resetForm() }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📦 Product Details
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
                        // Always keep slug in sync with name (sanitized)
                        const autoSlug = name
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')

                        setFormData(prev => ({
                          ...prev,
                          name,
                          slug: autoSlug || prev.slug   // keep old if name becomes empty
                        }))
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={formData.slug}
                      readOnly
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-3 text-gray-600"
                    />
                    <p className="text-xs text-green-600 mt-1">✓ Automatically cleaned from the product name. No spaces or special characters allowed.</p>
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      placeholder="Describe the product quality, origin, benefits..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Base Price & Stock (for products without size variants) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  💰 Base Price & Stock
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="800"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="720 (optional)"
                      value={formData.discountPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPrice: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock *</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Enter total stock in grams. For 12kg, enter 12000. Used when no size variants are added below.</p>
              </div>

              {/* Measurement Type + Smart Variants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 How is this product sold?</h3>

                <div className="flex gap-6 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="measurementType"
                      value="quantity"
                      checked={formData.measurementType === 'quantity'}
                      onChange={() => setFormData(prev => ({ ...prev, measurementType: 'quantity' }))}
                    />
                    <span className="font-medium">Quantity / Pieces</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="measurementType"
                      value="weight"
                      checked={formData.measurementType === 'weight'}
                      onChange={() => setFormData(prev => ({ ...prev, measurementType: 'weight' }))}
                    />
                    <span className="font-medium">Weight (kg / grams)</span>
                  </label>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {formData.measurementType === 'weight' ? '⚖️ Weight Sizes & Prices' : '📦 Quantity Sizes & Prices'}
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  {formData.measurementType === 'weight'
                    ? 'Example: 250g, 500g, 1kg. Enter how many grams each option actually contains.'
                    : 'Example: 1 piece, Pack of 5, 1 dozen. Enter how many pieces each option contains.'}
                </p>

                {variants.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4 text-sm">
                    No variants added. Product will use base price above.
                  </div>
                )}

                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl border">
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Display Size</label>
                        <input
                          type="text"
                          placeholder={formData.measurementType === 'weight' ? "250g" : "1 piece"}
                          value={variant.size}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index].size = e.target.value
                            setVariants(newVariants)
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="180"
                          value={variant.price}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index].price = e.target.value
                            setVariants(newVariants)
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Discount (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="160"
                          value={variant.discountPrice}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index].discountPrice = e.target.value
                            setVariants(newVariants)
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      {/* Conditional field based on measurement type */}
                      {formData.measurementType === 'weight' ? (
                        <div className="md:col-span-3">
                          <label className="text-xs text-gray-600 font-medium text-orange-600">Grams in this size *</label>
                          <input
                            type="number"
                            placeholder="250"
                            value={variant.weightGrams || ''}
                            onChange={(e) => {
                              const newVariants = [...variants]
                              newVariants[index].weightGrams = e.target.value
                              setVariants(newVariants)
                            }}
                            className="w-full border border-orange-300 rounded-lg px-3 py-2"
                          />
                        </div>
                      ) : (
<div className="md:col-span-3">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock (grams) *</label>
                     <input
                       type="number"
                       placeholder="12000 (for 12kg)"
                       value={formData.stock}
                       onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3"
                       required
                     />
                   </div>
                      )}

                      <div className="md:col-span-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = variants.filter((_, i) => i !== index)
                            setVariants(newVariants)
                          }}
                          className="w-full md:w-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setVariants([...variants, { size: '', price: '', discountPrice: '', weightGrams: '', pieces: '' }])}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  + Add Size Option
                </button>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🖼️ Product Photos (up to 3)</h3>
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
                      {formData.images[index] && (
                        <img
                          src={formData.images[index]}
                          alt={`Preview ${index + 1}`}
                          className="mx-auto h-24 w-24 object-cover rounded-xl border"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">First photo is used as the main image on the website.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg"
                >
                  {editingProduct ? 'Save Changes' : 'Add This Product to Store'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingProduct(null); resetForm() }}
                  className="px-8 py-3 border rounded-xl font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* SEO Content Sections */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 SEO Content</h3>
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

              {/* FAQ Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">❓ FAQ</h3>
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
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, {question: '', answer: ''}] }))}
                  className="mt-2 text-sm text-yellow-600 hover:text-yellow-700"
                >
                  + Add FAQ
                </button>
              </div>

              {/* SEO Keywords */}
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

              {/* Display Options */}
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
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{product.discountPrice || product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock >= 1000000 ? (product.stock / 1000000) + ' tons' 
                     : product.stock >= 1000 ? (product.stock / 1000) + ' kg' 
                     : product.stock + ' g'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${product.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {product.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                      {product.isFeatured && <span className="text-xs text-yellow-600 font-medium">★ Featured</span>}
                      {product.isTodayOffer && <span className="text-xs text-red-600 font-medium">🔥 Offer</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  )
}