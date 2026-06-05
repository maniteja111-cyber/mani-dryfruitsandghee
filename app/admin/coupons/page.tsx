'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Coupon {
  id: string
  code: string
  discountType: string
  value: number
  minOrder?: number
  maxDiscount?: number
  expiry?: string
  usageLimit?: number
  perUserLimit?: number
  isActive: boolean
  usedCount: number
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent',
    value: '',
    minOrder: '',
    maxDiscount: '',
    expiry: '',
    usageLimit: '',
    perUserLimit: '',
    isActive: true
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchCoupons()
  }, [])

  const checkAuth = () => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/login')
      return
    }
    const userData = JSON.parse(user)
    if (userData.phone !== '9999999999') {
      router.push('/')
      return
    }
  }

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        setCoupons(await res.json())
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        value: parseFloat(formData.value),
        minOrder: formData.minOrder ? parseFloat(formData.minOrder) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        expiry: formData.expiry || null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null
      }

      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        fetchCoupons()
        setShowForm(false)
        setEditingCoupon(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving coupon:', error)
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value.toString(),
      minOrder: coupon.minOrder?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      expiry: coupon.expiry ? new Date(coupon.expiry).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit?.toString() || '',
      perUserLimit: '',
      isActive: coupon.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchCoupons()
        }
      } catch (error) {
        console.error('Error deleting coupon:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percent',
      value: '',
      minOrder: '',
      maxDiscount: '',
      expiry: '',
      usageLimit: '',
      perUserLimit: '',
      isActive: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Coupons</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl font-semibold"
          >
            {showForm ? 'Close Form' : '+ Add New Coupon'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Coupon Code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <select
                value={formData.discountType}
                onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                type="number"
                placeholder={`Value (${formData.discountType === 'percent' ? '%' : '₹'})`}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
                step="0.01"
                required
              />
              {formData.discountType === 'percent' && (
                <input
                  type="number"
                  placeholder="Max Discount (optional, ₹)"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2"
                  step="0.01"
                />
              )}
              <input
                type="number"
                placeholder="Minimum Order (optional)"
                value={formData.minOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrder: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
                step="0.01"
              />
              <input
                type="number"
                placeholder="Usage Limit (optional)"
                value={formData.usageLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Per User Limit (optional)"
                value={formData.perUserLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, perUserLimit: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="Expiry Date (optional)"
                value={formData.expiry}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                Active
              </label>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 md:col-span-2"
              >
                {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{coupon.discountType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.discountType === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.minOrder ? `₹${coupon.minOrder}` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.usageLimit ? `${coupon.usedCount}/${coupon.usageLimit}` : coupon.usedCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(coupon)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
