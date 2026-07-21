export interface GiftBox {
  id: string
  name: string
  slug: string
  description: string | null
  heroImage: string | null
  thumbnail: string | null
  gallery: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  metaImage: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null

  fixedPrice: number
  originalPrice: number | null
  discount: number
  offerPrice: number | null
  gstRate: number
  packagingCharge: number
  deliveryCharge: number

  isActive: boolean
  isFeatured: boolean
  isTodayOffer: boolean
  sortOrder: number

  startDate: Date | null
  endDate: Date | null
  maxOrdersPerCustomer: number
  minQuantity: number
  maxQuantity: number

  createdAt: Date
  updatedAt: Date

  eligibleProducts: GiftBoxEligibleProduct[]
  rules: GiftBoxRule[]
  orders: GiftBoxOrder[]
  savedConfigurations: GiftBoxSavedConfiguration[]
  analytics: GiftBoxAnalytics[]
}

export interface GiftBoxEligibleProduct {
  id: string
  giftBoxId: string
  productId: string
  sortOrder: number
  price: number
  pricePerUnit: string | null
  product: Product
}

export interface GiftBoxRule {
  id: string
  giftBoxId: string
  ruleType: string
  ruleValue: string
  description: string | null
}

export interface GiftBoxOrder {
  id: string
  giftBoxId: string
  userId: string | null
  userName: string
  userPhone: string
  userEmail: string | null

  items: string
  totalWeight: number
  totalPrice: number
  discount: number
  GST: number
  packagingCharge: number
  deliveryCharge: number
  finalTotal: number
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface GiftBoxSavedConfiguration {
  id: string
  giftBoxId: string
  userId: string | null
  guestId: string | null
  name: string
  items: string
  totalWeight: number
  totalPrice: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GiftBoxAnalytics {
  id: string
  giftBoxId: string
  date: Date
  ordersCount: number
  totalRevenue: number
  avgOrderValue: number
  popularProducts: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  pricePerKg: number
  stockGrams: number
  isFeatured: boolean
  isTodayOffer: boolean
  isVisible: boolean
  images: string[]
  categoryId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}