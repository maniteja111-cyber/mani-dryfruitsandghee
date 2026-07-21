'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  slug: string
  stockGrams: number
}

interface GiftBox {
  id: string
  name: string
  slug: string
  description?: string
  heroImage?: string
  thumbnail?: string
  gallery?: string
  fixedPrice: number
  originalPrice?: number
  discount?: number
  offerPrice?: number
  isActive: boolean
  isFeatured: boolean
  isTodayOffer: boolean
  sortOrder: number
  startDate?: Date
  endDate?: Date
  maxOrdersPerCustomer?: number
  packagingCharge?: number
  deliveryCharge?: number
  gstRate?: number
  eligibleProducts: { id: string; productId: string; sortOrder: number; product: Product }[]
  rules: { id: string; ruleType: string; ruleValue: string; description?: string }[]
}

interface RuleForm {
  type: string
  value: string
  description: string
}

export default function AdminGiftBoxesPage() {
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGiftBox, setEditingGiftBox] = useState<GiftBox | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    heroImage: '',
    thumbnail: '',
    gallery: '',
    fixedPrice: '',
    originalPrice: '',
    discount: '',
    offerPrice: '',
    isActive: true,
    isFeatured: false,
    isTodayOffer: false,
    sortOrder: 0,
    startDate: '',
    endDate: '',
    maxOrdersPerCustomer: 0,
    packagingCharge: '',
    deliveryCharge: '',
    gstRate: '',
    eligibleProductIds: [] as string[],
    rules: [] as RuleForm[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [giftBoxesRes, productsRes] = await Promise.all([
        fetch('/api/gift-boxes'),
        fetch('/api/products')
      ])
      if (giftBoxesRes.ok) setGiftBoxes(await giftBoxesRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        fixedPrice: parseFloat(formData.fixedPrice),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
        offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : undefined,
        packagingCharge: formData.packagingCharge ? parseFloat(formData.packagingCharge) : 0,
        deliveryCharge: formData.deliveryCharge ? parseFloat(formData.deliveryCharge) : 0,
        gstRate: formData.gstRate ? parseFloat(formData.gstRate) : 18,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        maxOrdersPerCustomer: formData.maxOrdersPerCustomer || 0,
        eligibleProductIds: formData.eligibleProductIds,
        rules: formData.rules.length > 0 ? formData.rules : undefined
      }

      const url = editingGiftBox ? `/api/gift-boxes/${editingGiftBox.slug}` : '/api/gift-boxes'
      const method = editingGiftBox ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        fetchData()
        setShowForm(false)
        setEditingGiftBox(null)
        resetForm()
      } else {
        const err = await res.json().catch(() => ({}))
        alert('Failed to save: ' + (err.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving gift box:', error)
      alert('Something went wrong while saving the gift box.')
    }
  }

  const handleEdit = (giftBox: GiftBox) => {
    setEditingGiftBox(giftBox)
    setFormData({
      name: giftBox.name,
      slug: giftBox.slug,
      description: giftBox.description || '',
      heroImage: giftBox.heroImage || '',
      thumbnail: giftBox.thumbnail || '',
      gallery: giftBox.gallery || '',
      fixedPrice: giftBox.fixedPrice.toString(),
      originalPrice: giftBox.originalPrice?.toString() || '',
      discount: giftBox.discount?.toString() || '',
      offerPrice: giftBox.offerPrice?.toString() || '',
      isActive: giftBox.isActive,
      isFeatured: giftBox.isFeatured,
      isTodayOffer: giftBox.isTodayOffer,
      sortOrder: giftBox.sortOrder,
      startDate: giftBox.startDate ? new Date(giftBox.startDate).toISOString().slice(0, 16) : '',
      endDate: giftBox.endDate ? new Date(giftBox.endDate).toISOString().slice(0, 16) : '',
      maxOrdersPerCustomer: giftBox.maxOrdersPerCustomer || 0,
      packagingCharge: giftBox.packagingCharge?.toString() || '',
      deliveryCharge: giftBox.deliveryCharge?.toString() || '',
      gstRate: giftBox.gstRate?.toString() || '',
      eligibleProductIds: giftBox.eligibleProducts.map(e => e.productId),
      rules: giftBox.rules.map(r => ({
        type: r.ruleType,
        value: r.ruleValue,
        description: r.description || ''
      }))
    })
    setShowForm(true)
  }

  const handleDelete = async (slug: string) => {
    if (confirm('Are you sure you want to delete this gift box?')) {
      try {
        const res = await fetch(`/api/gift-boxes/${slug}`, { method: 'DELETE' })
        if (res.ok) fetchData()
      } catch (error) {
        console.error('Error deleting gift box:', error)
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData) => {
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
        setFormData(prev => ({ ...prev, [field]: imageUrl }))
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
      heroImage: '',
      thumbnail: '',
      gallery: '',
      fixedPrice: '',
      originalPrice: '',
      discount: '',
      offerPrice: '',
      isActive: true,
      isFeatured: false,
      isTodayOffer: false,
      sortOrder: 0,
      startDate: '',
      endDate: '',
      maxOrdersPerCustomer: 0,
      packagingCharge: '',
      deliveryCharge: '',
      gstRate: '',
      eligibleProductIds: [],
      rules: []
    })
  }

  const toggleProductSelection = (productId: string) => {
    setFormData(prev => {
      const selected = prev.eligibleProductIds.includes(productId)
      return {
        ...prev,
        eligibleProductIds: selected
          ? prev.eligibleProductIds.filter(id => id !== productId)
          : [...prev.eligibleProductIds, productId]
      }
    })
  }

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, { type: '', value: '', description: '' }]
    }))
  }

  const updateRule = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newRules = [...prev.rules]
      newRules[index] = { ...newRules[index], [field]: value }
      return { ...prev, rules: newRules }
    })
  }

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gift Box Builder</h1>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false)
              setEditingGiftBox(null)
              resetForm()
            } else {
              setShowForm(true)
            }
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
        >
          {showForm ? 'Close Form' : '+ Add New Gift Box'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow mb-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingGiftBox ? 'Edit Gift Box' : 'Create New Gift Box'}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingGiftBox(null); resetForm() }}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              X
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Healthy Box, Kids Box, Protein Box"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    setFormData(prev => ({ ...prev, name, slug: autoSlug || prev.slug }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (auto-generated)</label>
                <input
                  type="text"
                  value={formData.slug}
                  readOnly
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-3 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Price (Rs) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1299"
                  value={formData.fixedPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, fixedPrice: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1599"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="300"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price (auto)</label>
                <input
                  type="text"
                  value={formData.originalPrice && formData.discount 
                    ? (parseFloat(formData.originalPrice) - parseFloat(formData.discount)).toFixed(2)
                    : formData.fixedPrice}
                  readOnly
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-3 text-gray-600"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Full description of the gift box..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                rows={4}
              />
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hero Image *</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImage')} className="mb-2" />
                  {formData.heroImage && <img src={formData.heroImage} alt="Hero" className="h-24 w-24 object-cover rounded" />}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Thumbnail</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'thumbnail')} className="mb-2" />
                  {formData.thumbnail && <img src={formData.thumbnail} alt="Thumb" className="h-24 w-24 object-cover rounded" />}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gallery (optional)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} className="mb-2" />
                  {formData.gallery && <img src={formData.gallery} alt="Gallery" className="h-24 w-24 object-cover rounded" />}
                </div>
              </div>
            </div>

            {/* Pricing & Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing & Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, gstRate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Charge</label>
                  <input
                    type="number"
                    value={formData.packagingCharge}
                    onChange={(e) => setFormData(prev => ({ ...prev, packagingCharge: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge</label>
                  <input
                    type="number"
                    value={formData.deliveryCharge}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryCharge: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
              </div>
            </div>

            {/* Eligible Products */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Eligible Products</h3>
              <p className="text-sm text-gray-600 mb-2">Select products that can be included in this gift box:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {products.map(product => (
                  <label key={product.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.eligibleProductIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{product.name}</span>
                  </label>
                ))}
              </div>
              {formData.eligibleProductIds.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">No products selected</p>
              )}
            </div>

            {/* Rules */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Rules (Optional)</h3>
              <button
                type="button"
                onClick={addRule}
                className="text-sm text-yellow-600 hover:text-yellow-700 mb-3"
              >
                + Add Rule
              </button>
              {formData.rules.map((rule, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-200 rounded-lg mb-3">
                  <input
                    type="text"
                    placeholder="Rule type (e.g., minProducts, maxProducts)"
                    value={rule.type}
                    onChange={(e) => updateRule(index, 'type', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., 5, 10, 1000)"
                    value={rule.value}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={rule.description}
                    onChange={(e) => updateRule(index, 'description', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>

            {/* Schedule */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Display Options</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Featured</span>
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
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg"
              >
                {editingGiftBox ? 'Save Changes' : 'Create Gift Box'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingGiftBox(null); resetForm() }}
                className="px-8 py-3 border rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gift Box</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {giftBoxes.map(giftBox => (
              <tr key={giftBox.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{giftBox.name}</div>
                  <div className="text-xs text-gray-500">{giftBox.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  Rs.{giftBox.fixedPrice}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {giftBox.eligibleProducts?.length || 0} products
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${giftBox.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {giftBox.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button onClick={() => handleEdit(giftBox)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(giftBox.slug)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}