'use client'

import { useEffect, useState, Fragment } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface OrderItem {
  name: string
  quantity: number
  price: number
  variant?: any
}

interface Order {
  id: string
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  couponCode?: string
  discount?: number
  orderItems: OrderItem[]
}

export default function MyOrdersPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (e) {
      console.error('Error fetching settings:', e)
    }
  }

  const fetchMyOrders = async (phone: string) => {
    try {
      const res = await fetch(`/api/orders/user?phone=${phone}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    setUser(userData)

    fetchMyOrders(userData.phone)
    fetchSettings()
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <Link href="/" className="text-yellow-600 hover:text-yellow-800">
            ← Back to Home
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet.</p>
            <Link 
              href="/products" 
              className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">Order #{order.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="font-bold text-lg">₹{order.total}</div>
                      {order.paymentMethod && (
                        <div className="text-[10px] text-gray-400 capitalize">{order.paymentMethod}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simple Status Timeline */}
                <div className="px-6 pt-3 pb-2 bg-white">
                  <div className="flex items-center text-xs gap-1">
                    {['confirmed', 'shipped', 'delivered'].map((step, index) => {
                      const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
                      const isActive = statusOrder.indexOf(order.status) >= statusOrder.indexOf(step);
                      return (
                        <Fragment key={step}>
                          <div className={`px-2 py-0.5 rounded text-[10px] ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {step.charAt(0).toUpperCase() + step.slice(1)}
                          </div>
                          {index < 2 && <div className="flex-1 h-px bg-gray-200"></div>}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-3">
                    {order.orderItems.map((item, idx) => {
                      const v = item.variant ? (typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant) : null
                      let variantText = 'Standard'
                      if (v?.size) variantText = v.size
                      if (v?.weightGrams) variantText += ` (${v.weightGrams}g)`
                      if (v?.pieces) variantText += ` (${v.pieces} pc)`

                      return (
                        <div key={idx} className="flex justify-between text-sm border-b pb-2 last:border-0">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 ml-1">• {variantText}</span>
                          </div>
                          <div className="text-right">
                            ×{item.quantity} • ₹{item.price * item.quantity}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {order.couponCode && (
                    <div className="mt-3 text-sm text-green-600">
                      Coupon {order.couponCode} applied — Saved ₹{order.discount || 0}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                  </div>

                  <a
                    href={`https://wa.me/919515019393?text=Hi, I have a query about my order #${order.id.slice(0,8)}`}
                    target="_blank"
                    className="mt-3 block text-center text-sm bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    📲 Contact on WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer settings={settings} />
    </div>
  )
}
