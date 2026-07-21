'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  price: number
  discountPrice?: number | null | undefined
  images: string[]
  quantity: number
  selectedVariant?: any
  stock?: number
  purchasedAmount?: number
  unitType?: 'weight' | 'quantity'
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
  getProductStockInfo: (productId: string) => { totalInCart: number, maxAvailable: number, variantStock: Record<string, number> }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      const variantGrams = item.selectedVariant?.grams || 1000
      const stockValue = item.stock || 0
      const maxItems = stockValue > 0 ? Math.floor(stockValue / variantGrams) : 0
      
      if (existing) {
        const newQty = Math.min(maxItems, existing.quantity + (item.quantity || 1))
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: newQty, stock: item.stock } : i
        )
      }
      const initialQty = Math.min(maxItems, item.quantity || 1)
      return [...prev, { ...item, quantity: initialQty, stock: item.stock }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      const variantGrams = item.selectedVariant?.grams || 1000
      const stockValue = item.stock || 0
      const maxItems = stockValue > 0 ? Math.floor(stockValue / variantGrams) : 0
      const finalQty = Math.min(maxItems, quantity)
      return prev.map(i => 
        i.id === id ? { ...i, quantity: finalQty } : i
      )
    })
  }

  const canAddToCart = (productId: string, variantGrams: number, availableStockGrams: number) => {
    const gramsToAdd = variantGrams
    const itemsForProduct = items.filter(i => i.productId === productId)
    const totalGramsInCart = itemsForProduct.reduce((sum, i) => {
      return sum + (i.selectedVariant?.grams || 1000) * i.quantity
    }, 0)
    return (totalGramsInCart + gramsToAdd) <= availableStockGrams
  }

  const getProductStockInfo = (productId: string) => {
    const itemsForProduct = items.filter(i => i.productId === productId)
    const totalInCart = itemsForProduct.reduce((sum, i) => {
      return sum + (i.selectedVariant?.grams || 1000) * i.quantity
    }, 0)
    const maxAvailable = Math.max(...itemsForProduct.map(i => i.stock || 0))
    const variantStock: Record<string, number> = {}
    itemsForProduct.forEach(i => {
      if (i.selectedVariant?.size) {
        variantStock[i.selectedVariant.size] = i.quantity
      }
    })
    return { totalInCart, maxAvailable, variantStock }
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => 
    sum + (item.discountPrice || item.price) * item.quantity, 0
  )

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      getProductStockInfo
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}