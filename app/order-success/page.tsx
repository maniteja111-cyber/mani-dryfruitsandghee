'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Confetti from '@/components/Confetti'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

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

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Link href="/" className="text-yellow-600 hover:text-yellow-800">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const whatsappMessage = `Hi, I have placed an order with ID: ${order.id}. Total: ₹${order.total}. Please confirm delivery.`

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Order Placed Successfully!</h1>
            <p className="text-gray-600 mt-2">Thank you for your order. We'll process it shortly.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Order ID:</span>
                <span>{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment:</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span className="font-semibold">₹{order.total}</span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({order.couponCode})</span>
                  <span>-₹{order.discount || 0}</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Delivery Address:</h3>
              <p className="text-sm text-gray-600">
                {order.name}<br />
                {order.address}<br />
                {order.city}, {order.state} {order.pincode}<br />
                Phone: {order.phone}
              </p>
            </div>

             <div className="mt-6">
              <h3 className="font-semibold mb-3 text-lg border-b pb-2">Items Ordered</h3>
              <div className="space-y-3">
                {order.orderItems?.map((item: any, index: number) => {
                  const v = item.variant
                  let variantLabel = ''
                  if (v) {
                    if (v.size) variantLabel = v.size
                    if (v.weightGrams) variantLabel += ` (${v.weightGrams}g)`
                    if (v.pieces) variantLabel += ` (${v.pieces} pc)`
                  }

                  return (
                    <div key={index} className="flex justify-between text-sm border-b pb-2 last:border-b-0">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {variantLabel && (
                          <div className="text-xs text-gray-500">{variantLabel}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div>× {item.quantity}</div>
                        <div className="font-medium">₹{item.price * item.quantity}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-3 border-t">
                <span>Total Paid</span>
                <span>₹{order.total}</span>
              </div>
            </div>

           <div className="mt-8 flex space-x-4">
              <Link
                href={`https://wa.me/919876543210?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: settings.themeColor || '#10b981', color: '#fff' }}
                className="flex-1 py-3 rounded-lg text-center transition-colors hover:opacity-90"
              >
                Confirm on WhatsApp
              </Link>
              <Link
                href="/"
                style={{ backgroundColor: settings.themeColor || '#374151', color: '#fff' }}
                className="flex-1 py-3 rounded-lg text-center transition-colors hover:opacity-90"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer settings={settings} />
      <Confetti show={true} duration={4000} />
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div></div>}>
      <OrderSuccessContent />
    </Suspense>
  )
}