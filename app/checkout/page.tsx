'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/app/contexts/CartContext'

interface Address {
  id: string
  label: string
  name: string
  phone: string
  address: string
  address2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('cod')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [welcomeCoupon, setWelcomeCoupon] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  useEffect(() => {
    fetchSettings()
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const wc = urlParams.get('welcome')
      if (wc) {
        setWelcomeCoupon(wc)
        setCouponCode(wc)
      }
      
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr)
          setUser(parsed)
          setLoyaltyPoints(parsed.loyaltyPoints || 0)
          setFormData(prev => ({
            ...prev,
            name: parsed.name || '',
            phone: parsed.phone || ''
          }))
        } catch {}
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchAddresses()
    }
  }, [user])

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/user/addresses?userId=${user.id}`)
      if (res.ok) {
        const addrs = await res.json()
        setAddresses(addrs)
        const defaultAddr = addrs.find((a: Address) => a.isDefault)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id)
          setFormData({
            name: defaultAddr.name,
            phone: defaultAddr.phone,
            email: user?.email || '',
            address: defaultAddr.address,
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode
          })
        }
      }
    } catch (e) { console.error(e) }
  }

  const handleAddressSelect = (addr: Address) => {
    setSelectedAddressId(addr.id)
    setFormData({
      name: addr.name,
      phone: addr.phone,
      email: user?.email || '',
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode
    })
    setUseNewAddress(false)
  }
  
  useEffect(() => {
    if (welcomeCoupon) {
      applyCoupon()
    }
  }, [welcomeCoupon])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponError('')
    setAppliedCoupon(null)

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderTotal: total,
          userId: user?.id || null
        })
      })

      const data = await res.json()

      if (res.ok && data.valid) {
        setAppliedCoupon(data)
      } else {
        setCouponError(data.error || 'Invalid coupon')
      }
    } catch (err) {
      setCouponError('Failed to validate coupon')
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setAppliedCoupon(null)
    setCouponError('')
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpayPayment = async (orderData: any) => {
    setPaymentProcessing(true)

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, paymentMethod: 'razorpay' })
    })

    const order = await res.json()

    if (!res.ok || !order.razorpayOrderId) {
      setPaymentProcessing(false)
      alert(order.error || 'Failed to create Razorpay order')
      return
    }

    const razorpayLoaded = await loadRazorpayScript()
    if (!razorpayLoaded) {
      setPaymentProcessing(false)
      alert('Razorpay SDK failed to load. Please try again.')
      return
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'your_razorpay_key_id',
      amount: orderData.total * 100,
      currency: 'INR',
      name: 'MANI DRY FRUITS, PICKLES AND GHEE STORES',
      description: `Order #${order.id.slice(0, 8)}`,
      order_id: order.razorpayOrderId,
      handler: async function (response: any) {
        try {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id
            })
          })

          if (verifyRes.ok) {
            clearCart()
            router.push(`/order-success?orderId=${order.id}`)
          } else {
            alert('Payment was successful but verification failed. Please contact us.')
          }
        } catch (err) {
          alert('Payment verification error. Please contact support.')
        } finally {
          setPaymentProcessing(false)
        }
      },
      modal: {
        ondismiss: function () {
          setPaymentProcessing(false)
        }
      },
      prefill: {
        name: orderData.name,
        contact: orderData.phone
      },
      theme: {
        color: '#ffd862'
      }
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let finalTotal = appliedCoupon ? appliedCoupon.finalTotal : total
    // Apply loyalty points discount (100 pts = ₹50 off)
    const pointsDiscount = (pointsToRedeem / 100) * 50
    finalTotal = Math.max(0, finalTotal - pointsDiscount)

    const baseOrderData = {
      items,
      total: finalTotal,
      originalTotal: total,
      couponCode: appliedCoupon?.code || null,
      discount: (appliedCoupon?.discount || 0) + pointsDiscount,
      pointsRedeemed: pointsToRedeem,
      paymentMethod,
      ...formData
    }

    try {
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(baseOrderData)
      } else {
        // COD Flow
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseOrderData)
        })

        if (res.ok) {
          const order = await res.json()
          clearCart()
          // Store WhatsApp message temporarily if needed
          if (order.whatsappMessage) {
            sessionStorage.setItem('lastOrderWhatsapp', order.whatsappMessage)
          }
          router.push(`/order-success?orderId=${order.id}`)
        } else {
          const errorData = await res.json().catch(() => ({}))
          alert(errorData.error || 'Failed to place order')
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred during checkout')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items.length, router])

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
              
              {addresses.length > 0 && !useNewAddress && (
                <div className="mb-4 space-y-2">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id} 
                      onClick={() => handleAddressSelect(addr)}
                      className={`border rounded-lg p-3 cursor-pointer transition ${
                        selectedAddressId === addr.id ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{addr.name} ({addr.label})</p>
                          {addr.isDefault && <span className="text-xs text-yellow-600">Default</span>}
                          <p className="text-gray-700">{addr.address}{addr.address2 && `, ${addr.address2}`}</p>
                          <p className="text-gray-700">{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                        </div>
                        <input
                          type="radio"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleAddressSelect(addr)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setUseNewAddress(true)}
                    className="text-sm text-yellow-600 hover:text-yellow-700"
                  >
                    + Use a different address
                  </button>
                </div>
              )}

              {(useNewAddress || addresses.length === 0) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setUseNewAddress(false)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      ← Back to saved addresses
                    </button>
                  )}
                </div>
              )}
            </div>

{/* Coupon Section */}
             <div>
               <h2 className="text-xl font-semibold mb-4">Have a Coupon?</h2>
               <div className="flex gap-2">
                 <input
                   type="text"
                   placeholder="Enter coupon code"
                   value={couponCode}
                   onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                   className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                   disabled={!!appliedCoupon}
                 />
                 {!appliedCoupon ? (
                   <button
                     type="button"
                     onClick={applyCoupon}
                     className="px-6 bg-gray-800 text-white rounded-md hover:bg-black"
                   >
                     Apply
                   </button>
                 ) : (
                   <button
                     type="button"
                     onClick={removeCoupon}
                     className="px-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                   >
                     Remove
                   </button>
                 )}
               </div>
               {couponError && <p className="text-red-600 text-sm mt-1">{couponError}</p>}
               {appliedCoupon && (
                 <p className="text-green-600 text-sm mt-1">
                   Coupon applied! You save ₹{appliedCoupon.discount}
                 </p>
               )}
             </div>

             {/* Loyalty Points Redemption */}
             {loyaltyPoints > 0 && (
               <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                 <h3 className="font-semibold text-sm mb-2">Redeem Loyalty Points</h3>
                 <p className="text-xs text-gray-600 mb-2">You have {loyaltyPoints} points (100 pts = ₹50 off)</p>
                 <input
                   type="number"
                   min="0"
                   max={Math.floor(loyaltyPoints / 100) * 100}
                   step="100"
                   value={pointsToRedeem}
                   onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                   placeholder="Enter points to redeem (multiples of 100)"
                   className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                 />
                 <p className="text-xs text-green-600 mt-1">
                   Discount: ₹{(pointsToRedeem / 100) * 50}
                 </p>
               </div>
             )}

            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mr-2"
                  />
                  Cash on Delivery
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mr-2"
                  />
                  Online Payment (Razorpay)
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{(item.discountPrice || item.price) * item.quantity}</span>
                </div>
              ))}
              <hr />
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{appliedCoupon.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>{appliedCoupon ? 'Final Total' : 'Total'}:</span>
                <span>₹{appliedCoupon ? appliedCoupon.finalTotal : total}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || paymentProcessing}
              style={{ backgroundColor: settings.themeColor || '#f59e0b', color: '#fff' }}
              className="w-full py-3 rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold"
            >
              {paymentProcessing 
                ? 'Processing Payment...' 
                : loading 
                  ? 'Creating Order...' 
                  : 'Place Order'}
</button>
          </div>
        </form>
        </div>
      </main>
      <Footer settings={settings} />
    </div>
  )
}