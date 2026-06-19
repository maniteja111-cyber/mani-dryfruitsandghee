'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editAddress, setEditAddress] = useState<Address | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const parsed = JSON.parse(userStr)
    setUser(parsed)
    setAddresses(parsed.addresses ? JSON.parse(parsed.addresses) : [])
    setLoading(false)
  }, [router])

  const handleSave = async (data: Partial<Address>) => {
    const res = await fetch('/api/user/addresses', {
      method: editAddress ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editAddress ? { ...data, id: editAddress.id, userId: user.id } : { ...data, userId: user.id })
    })
    if (res.ok) {
      const updated = await res.json()
      setAddresses(Array.isArray(updated) ? updated : [updated])
      setShowForm(false)
      setEditAddress(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return
    const res = await fetch(`/api/user/addresses?id=${id}&userId=${user.id}`, { method: 'DELETE' })
    if (res.ok) {
      setAddresses(addrs => addrs.filter(a => a.id !== id))
    }
  }

  const AddressForm = () => {
    const [formData, setFormData] = useState<Partial<Address>>(editAddress || { label: 'Home', isDefault: false })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      handleSave(formData)
    }

    return (
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">{editAddress ? 'Edit' : 'Add'} Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} className="border p-2 rounded">
            <option value="">Select Label</option>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
          <input type="text" placeholder="Full Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-2 rounded" required />
          <input type="tel" placeholder="Phone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="border p-2 rounded" required />
          <input type="text" placeholder="Address Line 1" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="border p-2 rounded" required />
          <input type="text" placeholder="Address Line 2" value={formData.address2 || ''} onChange={e => setFormData({...formData, address2: e.target.value})} className="border p-2 rounded" />
          <input type="text" placeholder="City" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="border p-2 rounded" required />
          <input type="text" placeholder="State" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="border p-2 rounded" required />
          <input type="text" placeholder="Pincode" value={formData.pincode || ''} onChange={e => setFormData({...formData, pincode: e.target.value})} className="border p-2 rounded" required />
        </div>
        <label className="flex items-center gap-2 mt-4">
          <input type="checkbox" checked={formData.isDefault || false} onChange={e => setFormData({...formData, isDefault: e.target.checked})} />
          Set as default address
        </label>
        <div className="flex gap-2 mt-6">
          <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Save</button>
          <button type="button" onClick={() => { setShowForm(false); setEditAddress(null); }} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
        </div>
      </form>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">My Account</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <p className="text-gray-700">Name: {user?.name || '—'}</p>
          <p className="text-gray-700">Phone: {user?.phone}</p>
          <p className="text-gray-700">Email: {user?.email || '—'}</p>
          <p className="text-gray-700">Loyalty Points: {user?.loyaltyPoints || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Saved Addresses</h2>
            <button onClick={() => setShowForm(true)} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
              + Add Address
            </button>
          </div>

          {showForm && <AddressForm />}

          {!showForm && addresses.length === 0 && (
            <p className="text-gray-500">No saved addresses. Click "Add Address" to add one.</p>
          )}

          <div className="space-y-4 mt-4">
            {addresses.map(addr => (
              <div key={addr.id} className="border p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{addr.name} ({addr.label})</p>
                    {addr.isDefault && <span className="text-xs text-yellow-600">Default</span>}
                    <p className="text-gray-700">{addr.address}{addr.address2 && ', ' + addr.address2}</p>
                    <p className="text-gray-700">{addr.city}, {addr.state} {addr.pincode}</p>
                    <p className="text-sm text-gray-600">{addr.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditAddress(addr); setShowForm(true) }} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(addr.id)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}