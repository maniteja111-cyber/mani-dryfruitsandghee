'use client'

import { useEffect, useState, useMemo } from 'react'
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
  pricingTemplateId?: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface PricingTemplate {
  id: string
  name: string
}

type ProductType = 'weight' | 'quantity' | 'pack' | 'volume'

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

const PRICING_HELP: Record<ProductType, string> = {
  weight: 'Variant prices are calculated from the 1kg base price.',
  quantity: 'Variant prices are calculated from the price of one piece.',
  pack: 'Variant prices are calculated from the price of one pack.',
  volume: 'Variant prices are calculated from the price of one litre.'
}

const DEFAULT_TEMPLATE_ID = 'linear-pricing'

const STOCK_THRESHOLD_LOW = 5
const STOCK_THRESHOLD_MEDIUM = 20

const TEMPLATE_LABELS: Record<string, string> = {
  'linear-pricing': 'Linear Pricing',
  'premium': 'Premium',
  'moderate-margin': 'Moderate Margin',
  'premium-margin': 'Premium Margin',
  'nomarginsale': 'No Margin Sale',
  'none': 'No Template'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace('.', '')
  return `${datePart}, ${timePart}`
}

function getStockStatus(stock: number, productType: ProductType): { status: string; color: string } {
  if (stock <= 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' }
  if (productType === 'weight' && stock < STOCK_THRESHOLD_LOW * 1000) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
  if (productType === 'quantity' && stock < STOCK_THRESHOLD_LOW) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
  if (productType === 'pack' && stock < STOCK_THRESHOLD_LOW) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
  if (productType === 'volume' && stock < STOCK_THRESHOLD_LOW) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
  if (productType === 'weight' && stock < STOCK_THRESHOLD_MEDIUM * 1000) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-100' }
  if (productType === 'quantity' && stock < STOCK_THRESHOLD_MEDIUM) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-100' }
  if (productType === 'pack' && stock < STOCK_THRESHOLD_MEDIUM) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-100' }
  if (productType === 'volume' && stock < STOCK_THRESHOLD_MEDIUM) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-100' }
  return { status: 'High Stock', color: 'text-green-600 bg-green-100' }
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f3f4f6"/><text x="50" y="55" font-size="14" text-anchor="middle" fill="#9ca3af">?</text></svg>')

function getProductThumbnail(product: Product): string {
  try {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0] || PLACEHOLDER_IMAGE
    }
    if (typeof product.images === 'string') {
      const parsed = JSON.parse(product.images)
      return (parsed && parsed[0]) || PLACEHOLDER_IMAGE
    }
  } catch {
    // ignore
  }
  return PLACEHOLDER_IMAGE
}

type SortField = 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt' | 'category' | 'productType'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  category: string
  productType: string
  pricingTemplate: string
  visible: 'all' | 'visible' | 'hidden'
  featured: 'all' | 'featured' | 'not-featured'
  todayOffer: 'all' | 'offer' | 'not-offer'
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    productType: '',
    pricingTemplate: '',
    visible: 'all',
    featured: 'all',
    todayOffer: 'all'
  })
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes, variantsRes, templatesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/variants'),
        fetch('/api/admin/pricing-templates')
      ])
      if (productsRes.ok) {
        const data = await productsRes.json()
        setAllProducts(data)
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

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setCurrentPage(1)
    setSelectedIds([])
    fetchData()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p => {
        const typeName = p.extension?.masterUnit?.type || 'weight'
        const templateName = TEMPLATE_LABELS[p.pricingTemplateId || p.extension?.pricingTemplateId || DEFAULT_TEMPLATE_ID] || ''
        const seoKeywords = p.seoKeywords || ''
        const description = p.description || ''
        const categoryName = p.category?.name || ''
        return (
          p.name.toLowerCase().includes(term) ||
          (p.slug || '').toLowerCase().includes(term) ||
          categoryName.toLowerCase().includes(term) ||
          typeName.toLowerCase().includes(term) ||
          templateName.toLowerCase().includes(term) ||
          seoKeywords.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term)
        )
      })
    }

    if (filters.category) {
      result = result.filter(p => p.categoryId === filters.category)
    }
    if (filters.productType) {
      result = result.filter(p => (p.extension?.masterUnit?.type || 'weight') === filters.productType)
    }
    if (filters.pricingTemplate) {
      const templateId = filters.pricingTemplate === 'none' ? 'none' : filters.pricingTemplate
      result = result.filter(p => {
        const pTemplateId = p.pricingTemplateId || p.extension?.pricingTemplateId || DEFAULT_TEMPLATE_ID
        return pTemplateId === templateId
      })
    }
    if (filters.visible !== 'all') {
      result = result.filter(p => filters.visible === 'visible' ? p.isVisible : !p.isVisible)
    }
    if (filters.featured !== 'all') {
      result = result.filter(p => filters.featured === 'featured' ? p.isFeatured : !p.isFeatured)
    }
    if (filters.todayOffer !== 'all') {
      result = result.filter(p => filters.todayOffer === 'offer' ? p.isTodayOffer : !p.isTodayOffer)
    }

    result.sort((a, b) => {
      if (sortField === 'price') {
        const aPrice = a.extension?.basePrice || a.pricePerKg || 0
        const bPrice = b.extension?.basePrice || b.pricePerKg || 0
        return sortDirection === 'asc' ? aPrice - bPrice : bPrice - aPrice
      }

      if (sortField === 'stock') {
        const aStock = (a.extension?.masterUnit?.type || 'weight') === 'weight' 
          ? a.stockGrams 
          : (a.extension?.stockQuantity || 0)
        const bStock = (b.extension?.masterUnit?.type || 'weight') === 'weight' 
          ? b.stockGrams 
          : (b.extension?.stockQuantity || 0)
        return sortDirection === 'asc' ? aStock - bStock : bStock - aStock
      }

      if (sortField === 'productType') {
        const aType = a.extension?.masterUnit?.type || 'weight'
        const bType = b.extension?.masterUnit?.type || 'weight'
        return sortDirection === 'asc' 
          ? aType.localeCompare(bType) 
          : bType.localeCompare(aType)
      }

      const aVal = a[sortField as keyof Product]
      const bVal = b[sortField as keyof Product]

      if (aVal === undefined || aVal === null) return sortDirection === 'asc' ? -1 : 1
      if (bVal === undefined || bVal === null) return sortDirection === 'asc' ? 1 : -1
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }
      
      return sortDirection === 'asc' 
        ? (Number(aVal) - Number(bVal)) 
        : (Number(bVal) - Number(aVal))
    })

    return result
  }, [allProducts, searchTerm, filters, sortField, sortDirection])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredProducts.slice(start, start + rowsPerPage)
  }, [filteredProducts, currentPage, rowsPerPage])

  const totalRecords = filteredProducts.length
  const totalPages = Math.ceil(totalRecords / rowsPerPage)

  const stats = useMemo(() => {
    const stats = {
      total: allProducts.length,
      visible: allProducts.filter(p => p.isVisible).length,
      hidden: allProducts.filter(p => !p.isVisible).length,
      featured: allProducts.filter(p => p.isFeatured).length,
      todayOffers: allProducts.filter(p => p.isTodayOffer).length,
      lowStock: 0,
      outOfStock: 0,
      weight: 0,
      quantity: 0,
      pack: 0,
      volume: 0
    }

    allProducts.forEach(p => {
      const type = p.extension?.masterUnit?.type || 'weight'
      const stock = type === 'weight' ? p.stockGrams : (p.extension?.stockQuantity || 0)
      if (stock <= 0) stats.outOfStock++
      else if (type === 'weight' && stock < STOCK_THRESHOLD_LOW * 1000) stats.lowStock++
      else if (type === 'quantity' && stock < STOCK_THRESHOLD_LOW) stats.lowStock++
      else if (type === 'pack' && stock < STOCK_THRESHOLD_LOW) stats.lowStock++
      else if (type === 'volume' && stock < STOCK_THRESHOLD_LOW) stats.lowStock++

      switch (type) {
        case 'weight': stats.weight++; break
        case 'quantity': stats.quantity++; break
        case 'pack': stats.pack++; break
        case 'volume': stats.volume++; break
      }
    })

    return stats
  }, [allProducts])

  const handleToggle = async (id: string, field: keyof Product) => {
    try {
      const product = allProducts.find(p => p.id === id)
      if (!product) return

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          [field]: !product[field]
        })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling product:', error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return

    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.length} product(s)?`)) return
    if (action === 'hide' && !confirm(`Are you sure you want to hide ${selectedIds.length} product(s)?`)) return
    if (action === 'show' && !confirm(`Are you sure you want to show ${selectedIds.length} product(s)?`)) return

    try {
      const promises = selectedIds.map(id => {
        const product = allProducts.find(p => p.id === id)
        if (!product) return Promise.resolve()

        const updates: Partial<Product> = {}
        switch (action) {
          case 'delete':
            return fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
          case 'hide':
            updates.isVisible = false
            break
          case 'show':
            updates.isVisible = true
            break
          case 'featured':
            updates.isFeatured = true
            break
          case 'remove-featured':
            updates.isFeatured = false
            break
          case 'offer-on':
            updates.isTodayOffer = true
            break
          case 'offer-off':
            updates.isTodayOffer = false
            break
          case 'export':
            return exportSelected()
        }

        return fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...product, ...updates })
        })
      })

      await Promise.all(promises)
      fetchData()
      setSelectedIds([])
    } catch (error) {
      console.error('Error with bulk action:', error)
    }
  }

  const exportSelected = async () => {
    const selectedProducts = allProducts.filter(p => selectedIds.includes(p.id))
    const headers = ['Product Name', 'Slug', 'Category', 'Product Type', 'Price', 'Stock', 'Visible', 'Featured', 'Today Offer', 'Created', 'Updated']
    const rows = selectedProducts.map(p => {
      const type = p.extension?.masterUnit?.type || 'weight'
      const price = type === 'weight' ? (p.pricePerKg || 0) : (p.extension?.basePrice || 0)
      const stock = type === 'weight' ? (p.stockGrams / 1000).toFixed(2) : (p.extension?.stockQuantity || 0)
      return [
        p.name || '',
        p.slug || '',
        p.category?.name || '',
        type,
        '₹' + price,
        stock + ' ' + (type === 'weight' ? 'kg' : type === 'quantity' ? 'pcs' : type === 'pack' ? 'packs' : 'litres'),
        p.isVisible ? 'Yes' : 'No',
        p.isFeatured ? 'Yes' : 'No',
        p.isTodayOffer ? 'Yes' : 'No',
        formatDate(p.createdAt),
        formatDate(p.updatedAt)
      ]
    })

    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      pricePerKg: '',
      stockKg: '',
      stockQuantity: '',
      images: [],
      categoryId: '',
      productType: 'weight',
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
      seoKeywords: '',
      variantIds: [],
      pricingTemplateId: DEFAULT_TEMPLATE_ID
    })
  }

  const currentStock = formData.productType === 'weight' 
    ? formData.stockKg 
    : formData.stockQuantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const stockGrams = formData.productType === 'weight'
        ? (parseFloat(formData.stockKg) || 0) * 1000
        : 0

      const data = {
        ...formData,
        pricePerKg: formData.productType === 'weight' ? (parseFloat(formData.pricePerKg) || null) : null,
        stockGrams,
        stockQuantity: formData.productType === 'weight' ? undefined : (parseFloat(formData.stockQuantity) || 0),
        basePrice: formData.productType === 'weight' ? formData.pricePerKg : formData.pricePerKg,
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product)

    let loadedImages: string[] = []
    try {
      if (Array.isArray(product.images)) {
        loadedImages = product.images
      } else if (typeof product.images === 'string') {
        loadedImages = JSON.parse(product.images)
      }
    } catch {
      loadedImages = typeof product.images === 'string' ? [product.images] : []
    }
    while (loadedImages.length < 3) loadedImages.push('')

    const existingVariantIds = (product as any).productVariants?.map((pv: any) => pv.variantId) || []
    const productType = product.extension?.masterUnit?.type || 'weight'
    const basePrice = product.extension?.basePrice || product.pricePerKg || 0

    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      pricePerKg: productType === 'weight' ? (product.pricePerKg?.toString() || '') : basePrice.toString(),
      stockKg: (product.stockGrams / 1000).toFixed(2),
      stockQuantity: product.extension?.stockQuantity?.toString() || '',
      images: loadedImages,
      categoryId: product.categoryId,
      productType: productType,
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
      seoKeywords: product.seoKeywords || '',
      variantIds: existingVariantIds,
      pricingTemplateId: product.pricingTemplateId || product.extension?.pricingTemplateId || DEFAULT_TEMPLATE_ID
    })

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

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const clearSelection = () => setSelectedIds([])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return ''
    return sortDirection === 'asc' ? ' ▲' : ' ▼'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-10 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
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
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug (auto-generated)</label>
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
                    {pricingTemplates.map((template: any) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Pricing templates define how variant prices are calculated from the base price</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Variants</h3>
                  <p className="text-sm text-gray-600 mb-3">Assign variants from the master variant list. Variants determine available sizes/quantities for this product.</p>
                  {variants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {variants
                        .filter((variant: any) => variant.unit?.type === formData.productType)
                        .map((variant: any) => (
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
                    {PRODUCT_TYPE_UNITS[formData.productType].priceLabel} *
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
                    placeholder="10"
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
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, {question: '', answer: ''}] }))}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-700"
              >
                + Add FAQ
              </button>
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
                  <span className="text-sm">Today&apos;s Offer</span>
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
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Products</h2>
              <p className="text-sm text-gray-500">Showing {totalRecords} products</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
              </select>

              <select
                value={sortField}
                onChange={(e) => handleSort(e.target.value as SortField)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="updatedAt">Sort by Updated {getSortIcon('updatedAt')}</option>
                <option value="name">Sort by Name {getSortIcon('name')}</option>
                <option value="price">Sort by Price {getSortIcon('price')}</option>
                <option value="stock">Sort by Stock {getSortIcon('stock')}</option>
                <option value="createdAt">Sort by Created {getSortIcon('createdAt')}</option>
                <option value="category">Sort by Category {getSortIcon('category')}</option>
                <option value="productType">Sort by Type {getSortIcon('productType')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
                  <button
                    onClick={clearSelection}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Product {getSortIcon('name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('price')}>
                  Price {getSortIcon('price')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('stock')}>
                  Stock {getSortIcon('stock')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                  Category {getSortIcon('category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">No products found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => {
                  const productType = product.extension?.masterUnit?.type || 'weight'
                  const unit = PRODUCT_TYPE_UNITS[productType]
                  const price = productType === 'weight'
                    ? (product.pricePerKg || 0)
                    : (product.extension?.basePrice || product.pricePerKg || 0)
                  const stock = productType === 'weight'
                    ? (product.stockGrams / 1000).toFixed(2)
                    : (product.extension?.stockQuantity || 0).toString()
                  const stockInfo = getStockStatus(
                    productType === 'weight' ? product.stockGrams : (product.extension?.stockQuantity || 0),
                    productType
                  )
                  const templateName = TEMPLATE_LABELS[product.pricingTemplateId || product.extension?.pricingTemplateId || DEFAULT_TEMPLATE_ID] || 'Linear Pricing'

                  return (
                    <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/products/${product.id}/edit`) }}
                            className="w-10 h-10 rounded-lg object-cover border cursor-pointer hover:opacity-80 flex items-center justify-center bg-white border-gray-300"
                          >
                            <img
                              src={getProductThumbnail(product)}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                            />
                          </button>
                          <div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); router.push(`/admin/products/${product.id}/edit`) }}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                            >
                              {product.name}
                            </button>
                            <div className="text-xs text-gray-500">
                              <div>{product.slug}</div>
                              <div>{product.category?.name}</div>
                              <div className="inline-flex items-center px-2 py-0.5 text-xs rounded-full ${unit.color}">
                                {productType}
                              </div>
                              <div>{templateName}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {'₹' + price + '/' + unit.plural}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stock + ' ' + unit.plural}</div>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${stockInfo.color}`}>
                          {stockInfo.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {product.isVisible ? (
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                              Visible
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              Hidden
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600 font-medium">
                              ⭐ Featured
                            </span>
                          )}
                          {product.isTodayOffer && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                              🏷️ Offer
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.isVisible}
                              onChange={() => handleToggle(product.id, 'isVisible')}
                              className="w-4 h-4"
                            />
                            <span className="text-xs text-gray-600">Visible</span>
                          </label>

                          <label className="relative inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.isFeatured}
                              onChange={() => handleToggle(product.id, 'isFeatured')}
                              className="w-4 h-4"
                            />
                            <span className="text-xs text-gray-600">Featured</span>
                          </label>

                          <label className="relative inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.isTodayOffer}
                              onChange={() => handleToggle(product.id, 'isTodayOffer')}
                              className="w-4 h-4"
                            />
                            <span className="text-xs text-gray-600">Offer</span>
                          </label>

                          <select
                            onChange={(e) => {
                              const newValue = e.target.value
                              if (newValue === 'edit') router.push(`/admin/products/${product.id}/edit`)
                              if (newValue === 'delete') handleDelete(product.id)
                            }}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1 text-xs focus:outline-none"
                          >
                            <option value="">Actions</option>
                            <option value="edit">Edit</option>
                            <option value="delete">Delete</option>
                          </select>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {selectedIds.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBulkAction('delete')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => handleBulkAction('hide')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Hide
              </button>
              <button
                onClick={() => handleBulkAction('show')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Show
              </button>
              <button
                onClick={() => handleBulkAction('featured')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-50 rounded"
              >
                Featured
              </button>
              <button
                onClick={() => handleBulkAction('remove-featured')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Remove Featured
              </button>
              <button
                onClick={() => handleBulkAction('offer-on')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Offer On
              </button>
              <button
                onClick={() => handleBulkAction('offer-off')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Offer Off
              </button>
              <select
                onChange={(e) => {
                  const value = e.target.value
                  if (value === 'category') {
                    const catId = prompt('Enter category ID:')
                    if (catId) {
                      selectedIds.forEach(id => {
                        const product = allProducts.find(p => p.id === id)
                        if (product) {
                          fetch(`/api/admin/products/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...product, categoryId: catId })
                          })
                        }
                      })
                      fetchData()
                    }
                  } else if (value === 'template') {
                    const templateId = prompt('Enter pricing template ID (or "none" for no template):')
                    if (templateId) {
                      selectedIds.forEach(id => {
                        const product = allProducts.find(p => p.id === id)
                        if (product) {
                          fetch(`/api/admin/products/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              ...product, 
                              extension: {
                                ...product.extension,
                                pricingTemplateId: templateId === 'none' ? null : templateId
                              }
                            })
                          })
                        }
                      })
                      fetchData()
                    }
                  } else if (value === 'export') {
                    handleBulkAction('export')
                  }
                }}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
              >
                <option value="">Change...</option>
                <option value="category">Change Category</option>
                <option value="template">Change Pricing Template</option>
                <option value="export">Export Selected</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}