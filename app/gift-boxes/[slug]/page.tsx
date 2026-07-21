'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { GiftBox, Product, GiftBoxEligibleProduct } from '@/types'

interface CartItem {
  productId: string
  quantityGrams: number
  variant: '125g' | '250g' | '500g' | '1kg'
  price: number
}

const VARIANT_GRAMS: Record<string, number> = {
  '125g': 125,
  '250g': 250,
  '500g': 500,
  '1kg': 1000
}

export default function GiftBoxBuilderPage({ params }: { params: Promise<{ slug: string }> }): React.ReactElement {
  const [slug, setSlug] = useState<string>('')
  const [giftBoxData, setGiftBoxData] = useState<GiftBox | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'review'>('select')
  const [selectedProduct, setSelectedProduct] = useState<GiftBoxEligibleProduct | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(250)
  const [selectedVariant, setSelectedVariant] = useState<'125g' | '250g' | '500g' | '1kg'>('250g')

  const router = useRouter()

  useEffect(() => {
    async function loadGiftBox() {
      try {
        const resolvedParams = await params
        const res = await fetch(`/api/gift-boxes/${resolvedParams.slug}`)
        if (res.ok) {
          const data = await res.json()
          setGiftBoxData(data)
          setSlug(resolvedParams.slug)
        } else {
          router.push('/gift-boxes')
        }
      } catch (error) {
        console.error('Error loading gift box:', error)
        router.push('/gift-boxes')
      } finally {
        setIsLoading(false)
      }
    }
    loadGiftBox()
  }, [params, router])

  const addToCart = useCallback(() => {
    if (!selectedProduct) return

    const existingItem = cart.find(item => item.productId === selectedProduct.product.id)
    const newQuantity = existingItem ? existingItem.quantityGrams + selectedQuantity : selectedQuantity

    const newItem: CartItem = {
      productId: selectedProduct.product.id,
      quantityGrams: newQuantity,
      variant: selectedVariant,
      price: selectedProduct.price || 0
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === selectedProduct.product.id ? newItem : item
      ))
    } else {
      setCart([...cart, newItem])
    }

    setCurrentStep('review')
    setSelectedProduct(null)
    setSelectedQuantity(250)
    setSelectedVariant('250g')
  }, [selectedProduct, selectedQuantity, selectedVariant, cart])

  const removeFromCart = useCallback((productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
    if (cart.length === 0) setCurrentStep('select')
  }, [cart])

  const calculateTotal = useCallback(() => {
    if (!giftBoxData) return { total: 0, items: 0 }
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantityGrams) / VARIANT_GRAMS[item.variant], 0)
    const total = giftBoxData.fixedPrice + subtotal
    return { total, items: cart.length }
  }, [giftBoxData, cart])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading gift box...</p>
        </div>
      </div>
    )
  }

  if (!giftBoxData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const { total, items } = calculateTotal()
  const { name, description } = giftBoxData
  const { heroImage, fixedPrice, originalPrice, minQuantity, maxQuantity } = giftBoxData

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={{}} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-2"
          >
            ← Back to Gift Boxes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
              {description && (
                <p className="text-gray-600 mb-4">{description}</p>
              )}
              
              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Gift Box Price</span>
                    <p className="text-2xl font-bold text-yellow-600">
                      Rs.{fixedPrice}
                    </p>
                  </div>
                  {originalPrice && originalPrice > fixedPrice && (
                    <div className="hidden md:block">
                      <span className="text-sm line-through text-gray-400">
                        Rs.{originalPrice}
                      </span>
                      <p className="text-sm text-green-600 font-semibold">
                        Save Rs.{originalPrice - fixedPrice}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {currentStep === 'select' && (
                <ProductSelection
                  products={giftBoxData.eligibleProducts}
                  onSelectProduct={setSelectedProduct}
                  minQuantity={minQuantity || 125}
                  maxQuantity={maxQuantity || 1000}
                />
              )}

              {currentStep === 'configure' && selectedProduct && (
                <ProductConfiguration
                  product={selectedProduct.product}
                  quantity={selectedQuantity}
                  variant={selectedVariant}
                  onQuantityChange={setSelectedQuantity}
                  onVariantChange={setSelectedVariant}
                  minQuantity={minQuantity || 125}
                  maxQuantity={maxQuantity || 1000}
                  onAddToCart={addToCart}
                  onCancel={() => setCurrentStep('select')}
                />
              )}

              {currentStep === 'review' && (
                <CartReview
                  cart={cart}
                  giftBox={giftBoxData}
                  total={total}
                  onRemove={removeFromCart}
                  onProceedToCheckout={() => {}}
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Selection</h2>
              {cart.length === 0 ? (
                <p className="text-gray-500 py-4 text-center">No items selected yet</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        🥜
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Item {cart.indexOf(item) + 1}</p>
                        <p className="text-sm text-gray-500">{item.quantityGrams}g</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Items: {items}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setCurrentStep('review')}
                disabled={cart.length === 0}
                className="w-full mt-4 bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Continue to Checkout
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer settings={{}} />
      <WhatsAppButton phone="9515019393" />
      <RewardsButton phone="9515019393" />
    </div>
  )
}

function ProductSelection({ products, onSelectProduct, minQuantity, maxQuantity }: {
  products: GiftBoxEligibleProduct[]
  onSelectProduct: (product: GiftBoxEligibleProduct) => void
  minQuantity: number
  maxQuantity: number
}): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredProducts = products.filter(p =>
    p.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Your Products</h3>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No products available</p>
        ) : (
          filteredProducts.map(item => (
            <div
              key={item.product.id}
              onClick={() => onSelectProduct(item)}
              className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  🥜
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                  <p className="text-sm text-gray-500">
                    Rs.{item.price} per {item.pricePerUnit || '250g'}
                  </p>
                </div>
                <div className="text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ProductConfiguration({
  product,
  quantity,
  variant,
  onQuantityChange,
  onVariantChange,
  minQuantity,
  maxQuantity,
  onAddToCart,
  onCancel
}: {
  product: Product
  quantity: number
  variant: '125g' | '250g' | '500g' | '1kg'
  onQuantityChange: (qty: number) => void
  onVariantChange: (v: '125g' | '250g' | '500g' | '1kg') => void
  minQuantity: number
  maxQuantity: number
  onAddToCart: () => void
  onCancel: () => void
}): React.ReactElement {
  const variants = ['125g', '250g', '500g', '1kg'] as const
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600">{product.description}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant</label>
        <div className="flex gap-2">
          {variants.map(v => (
            <button
              key={v}
              onClick={() => onVariantChange(v)}
              className={`px-4 py-2 rounded-lg border transition ${
                variant === v
                  ? 'bg-yellow-600 text-white border-yellow-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity ({VARIANT_GRAMS[variant]}g per unit)
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onQuantityChange(Math.max(minQuantity, quantity - VARIANT_GRAMS[variant] || 250))}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            −
          </button>
          <span className="text-xl font-bold w-20 text-center">{quantity}g</span>
          <button
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + VARIANT_GRAMS[variant] || 250))}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAddToCart}
          className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
        >
          Add to Box
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function CartReview({ cart, giftBox, total, onRemove, onProceedToCheckout }: {
  cart: CartItem[]
  giftBox: GiftBox
  total: number
  onRemove: (id: string) => void
  onProceedToCheckout: () => void
}): React.ReactElement {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Selection</h3>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-2">Gift Box Base Price:</p>
        <p className="text-lg font-semibold">Rs.{giftBox.fixedPrice}</p>
      </div>

      {cart.length > 0 && (
        <div className="space-y-3 mb-6">
          {cart.map((item, index) => (
            <div key={item.productId} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span>Item {index + 1}</span>
              <span>{item.quantityGrams}g</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total:</span>
          <span className="text-yellow-600">Rs.{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {}}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          Edit Selection
        </button>
        <button
          onClick={onProceedToCheckout}
          className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}