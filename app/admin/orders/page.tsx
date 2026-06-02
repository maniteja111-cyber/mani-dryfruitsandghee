'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateStatusUpdateMessage, generateOrderConfirmationMessage } from '@/lib/whatsapp'

interface OrderItem {
  product: { name: string }
  quantity: number
  price: number
  variant?: any
}

interface Order {
  id: string
  total: number
  status: string
  paymentMethod: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  createdAt: string
  couponCode?: string
  discount?: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  orderItems: OrderItem[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [settingsObj, setSettingsObj] = useState<Record<string, string>>({})
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending-cod'>('all')
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
    fetchSettings()
  }, [])

  useEffect(() => {
    applyFilter(orders, paymentFilter)
  }, [paymentFilter, orders])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        applyFilter(data, paymentFilter)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const applyFilter = (data: Order[], filter: string) => {
    let result = data
    if (filter === 'paid') {
      result = data.filter(o => o.razorpayPaymentId || (o.paymentMethod === 'cod' && ['confirmed', 'shipped', 'delivered'].includes(o.status)))
    } else if (filter === 'pending-cod') {
      result = data.filter(o => o.paymentMethod === 'cod' && o.status === 'pending')
    }
    setFilteredOrders(result)
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        const obj = data.reduce((acc: any, s: any) => {
          acc[s.key] = s.value
          return acc
        }, {})
        setSettingsObj(obj)
      }
    } catch (e) {
      console.error('Failed to load settings')
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
      </div>

      <div className="max-w-7xl">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name, phone or Order ID..."
            onChange={(e) => {
              const term = e.target.value.toLowerCase()
              const filtered = orders.filter(o =>
                o.name.toLowerCase().includes(term) ||
                o.phone.includes(term) ||
                o.id.toLowerCase().includes(term)
              )
              setFilteredOrders(filtered)
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
          />
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid Orders</option>
            <option value="pending-cod">Pending COD</option>
          </select>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.name}</div>
                    <div className="text-sm text-gray-500">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{order.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.razorpayPaymentId ? (
                      <div>
                        <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Paid (Razorpay)</span>
                      </div>
                    ) : order.paymentMethod === 'cod' ? (
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                          ['confirmed','shipped','delivered'].includes(order.status) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {['confirmed','shipped','delivered'].includes(order.status) ? 'Paid (COD)' : 'Pending (COD)'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">{order.paymentMethod}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      View
                    </button>

                    <button
                      onClick={() => {
                        const msg = generateStatusUpdateMessage(order, order.status, settingsObj.whatsappNumber || '919515019393')
                        const phone = settingsObj.whatsappNumber || '919515019393'
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                      }}
                      className="text-green-600 hover:text-green-800 mr-2 text-xs px-2 py-1 border border-green-200 rounded"
                    >
                      📲 WhatsApp
                    </button>

                    {/* Quick Mark as Paid for COD */}
                    {order.paymentMethod === 'cod' && order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="text-emerald-600 hover:text-emerald-800 mr-2 text-xs px-2 py-1 border border-emerald-200 rounded bg-emerald-50"
                      >
                        Mark as Paid
                      </button>
                    )}

                    <select
                      value={order.status}
                      onChange={(e) => {
                        const newStatus = e.target.value
                        updateOrderStatus(order.id, newStatus)
                        // Auto suggest WhatsApp update
                        setTimeout(() => {
                          if (confirm(`Send WhatsApp update for status "${newStatus}" to ${order.name}?`)) {
                            const msg = generateStatusUpdateMessage(order, newStatus, settingsObj.whatsappNumber || '919515019393')
                            const phone = settingsObj.whatsappNumber || '919515019393'
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                          }
                        }, 300)
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-3xl leading-none text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6 print:p-8" id="invoice-content">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Customer</span>
                  <div className="font-semibold">{selectedOrder.name}</div>
                  <div>{selectedOrder.phone}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Order ID</span>
                  <div className="font-mono text-xs break-all">{selectedOrder.id}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* WhatsApp Confirmation Message (for new orders) */}
              {['pending', 'confirmed'].includes(selectedOrder.status) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-green-700 text-sm">WhatsApp Confirmation Message</span>
                    <button
                      onClick={() => {
                        const msg = generateOrderConfirmationMessage(selectedOrder, settingsObj?.whatsappNumber || '919515019393')
                        navigator.clipboard.writeText(msg)
                        alert('Message copied!')
                      }}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap font-mono text-gray-700 max-h-32 overflow-auto">
                    {generateOrderConfirmationMessage(selectedOrder, settingsObj?.whatsappNumber || '919515019393')}
                  </pre>
                  <button
                    onClick={() => {
                      const msg = generateOrderConfirmationMessage(selectedOrder, settingsObj?.whatsappNumber || '919515019393')
                      const phone = settingsObj?.whatsappNumber || '919515019393'
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                    }}
                    className="mt-2 text-xs w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded"
                  >
                    📲 Send Confirmation on WhatsApp
                  </button>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Items Ordered</h3>
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Variant</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems.map((item, idx) => {
                      const v = item.variant
                      const variantText = v ? (v.size || v.weightGrams ? `${v.size || ''}` : 'Standard') : 'Standard'
                      const lineTotal = item.price * item.quantity

                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-3 font-medium">{item.product?.name || 'Unknown Product'}</td>
                          <td className="p-3 text-gray-600">
                            {variantText}
                            {v?.weightGrams && ` (${v.weightGrams}g)`}
                            {v?.pieces && ` (${v.pieces} pc)`}
                          </td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">₹{item.price}</td>
                          <td className="p-3 text-right font-medium">₹{lineTotal}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-bold text-lg">
                      <td colSpan={4} className="p-3 text-right">Grand Total</td>
                      <td className="p-3 text-right">₹{selectedOrder.total}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment & Status */}
              <div className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">Payment:</span> {selectedOrder.paymentMethod.toUpperCase()}
                  {selectedOrder.razorpayPaymentId && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Payment ID: {selectedOrder.razorpayPaymentId}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`capitalize px-2 py-0.5 rounded text-xs font-semibold ${
                    selectedOrder.status === 'confirmed' || selectedOrder.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Coupon Info */}
              {(selectedOrder as any).couponCode && (
                <div className="bg-green-50 p-3 rounded text-sm">
                  <span className="font-medium">Coupon Applied:</span>{' '}
                  <span className="font-mono font-semibold">{(selectedOrder as any).couponCode}</span>
                  {' '}- Saved ₹{(selectedOrder as any).discount || 0}
                </div>
              )}
            </div>

            <div className="border-t p-4 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!selectedOrder) return

                    const msg = generateStatusUpdateMessage(selectedOrder, selectedOrder.status, settingsObj?.whatsappNumber || '919515019393')
                    const phone = settingsObj?.whatsappNumber || '919515019393'
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                >
                  📲 WhatsApp
                </button>

                <button
                  onClick={() => {
                    if (!selectedOrder) return

                    // Create a clean printable invoice
                    const printWindow = window.open('', '_blank')
                    if (!printWindow) return alert('Please allow popups for invoice')

                    const storeName = settingsObj['siteName'] || 'Mani Dry Fruits & Ghee'
                    const address = settingsObj['address'] || ''
                    const phone = settingsObj['phone'] || ''
                    const email = settingsObj['email'] || ''

                    let itemsHtml = ''
                    selectedOrder.orderItems.forEach(item => {
                      const v = item.variant
                      let variantText = ''
                      if (v) {
                        if (v.size) variantText = v.size
                        if (v.weightGrams) variantText += ` (${v.weightGrams}g)`
                      }
                      const lineTotal = item.price * item.quantity
                      itemsHtml += `
                        <tr>
                          <td style="padding:8px; border-bottom:1px solid #ddd;">${item.product?.name || 'Product'} ${variantText}</td>
                          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${item.quantity}</td>
                          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">₹${item.price}</td>
                          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">₹${lineTotal}</td>
                        </tr>
                      `
                    })

                    const html = `
                      <html>
                        <head>
                          <title>Invoice - ${selectedOrder.id}</title>
                          <style>
                            @page { margin: 20px; }
                            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
                            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                            .store-name { font-size: 22px; font-weight: 700; margin: 0; }
                            .store-info { font-size: 13px; color: #444; margin-top: 4px; }
                            .invoice-title { font-size: 28px; font-weight: 700; margin: 0; color: #222; }
                            .invoice-meta { text-align: right; font-size: 13px; }
                            .bill-to { margin: 25px 0; }
                            .bill-to strong { display: block; margin-bottom: 4px; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
                            th { background: #f8f8f8; padding: 10px 8px; text-align: left; border-bottom: 2px solid #000; font-weight: 600; }
                            td { padding: 8px; border-bottom: 1px solid #eee; }
                            .text-right { text-align: right; }
                            .total-row { font-size: 16px; font-weight: 700; border-top: 2px solid #000; }
                            .footer { margin-top: 40px; font-size: 12px; color: #555; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
                            .thanks { font-weight: 600; margin-top: 10px; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div>
                              <div class="store-name">${storeName}</div>
                              <div class="store-info">${address}<br>Phone: ${phone} ${email ? '| ' + email : ''}</div>
                            </div>
                            <div class="invoice-meta">
                              <div class="invoice-title">INVOICE</div>
                              <div>#${selectedOrder.id.slice(0,8)}</div>
                              <div>${new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</div>
                            </div>
                          </div>

                          <div class="bill-to">
                            <strong>Bill To:</strong>
                            ${selectedOrder.name}<br>
                            ${selectedOrder.phone}<br>
                            ${selectedOrder.address}, ${selectedOrder.city}, ${selectedOrder.state} - ${selectedOrder.pincode}
                          </div>

                          <table>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th class="text-right">Qty</th>
                                <th class="text-right">Rate</th>
                                <th class="text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${itemsHtml}
                            </tbody>
                          </table>

                          <div style="text-align: right; font-size: 18px; font-weight: 700; margin-top: 10px;">
                            Total: ₹${selectedOrder.total}
                          </div>

                          <div class="footer">
                            <div>Payment: ${selectedOrder.paymentMethod.toUpperCase()} ${selectedOrder.razorpayPaymentId ? '(Razorpay)' : ''}</div>
                            <div class="thanks">Thank you for shopping with us!</div>
                            <div style="margin-top: 8px; font-size: 11px;">For any queries, contact us on WhatsApp.</div>
                          </div>
                        </body>
                      </html>
                    `

                    printWindow.document.write(html)
                    printWindow.document.close()
                    printWindow.focus()
                    setTimeout(() => printWindow.print(), 500)
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm flex items-center gap-2 no-print"
                >
                  🖨️ Print Invoice
                </button>

                <button
                  onClick={() => {
                    if (!selectedOrder) return
                    const confirmationMsg = generateOrderConfirmationMessage(selectedOrder, settingsObj?.whatsappNumber || '919515019393')
                    navigator.clipboard.writeText(confirmationMsg)
                    alert('Confirmation message copied!')
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                >
                  📋 Copy Confirmation
                </button>

                <button
                  onClick={() => {
                    if (!selectedOrder) return
                    const msg = generateOrderConfirmationMessage(selectedOrder, settingsObj?.whatsappNumber || '919515019393')
                    const phone = settingsObj?.whatsappNumber || '919515019393'
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-2"
                >
                  📲 Resend Confirmation
                </button>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}