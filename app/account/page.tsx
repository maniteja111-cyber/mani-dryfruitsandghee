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
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [formData, setFormData] = useState({ label: '', name: '', phone: '', address: '', address2: '', city: '', state: '', pincode: '', isDefault: false })
  const router = useRouter()

  const fetchAddresses = async (phone: string) => {
    try {
      const res = await fetch(`/api/user/addresses?phone=${phone}`)
      if (res.ok) {
        const { addresses } = await res.json()
        setAddresses(addresses)
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const parsed = JSON.parse(userStr)
    setUser(parsed)
    setLoyaltyPoints(parsed.loyaltyPoints || 0)
    fetchAddresses(parsed.phone)
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    const { name, value, type, checked } = target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/user/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone, address: { ...formData, id: editingId || undefined } })
    })
    if (res.ok) {
      const { addresses } = await res.json()
      setAddresses(addresses)
      setFormData({ label: '', name: user.name || '', phone: user.phone || '', address: '', address2: '', city: '', state: '', pincode: '', isDefault: false })
      setShowForm(false)
      setEditingId(null)
    }
  }

  const handleEdit = (addr: Address) => {
    setFormData({ label: addr.label, name: addr.name, phone: addr.phone, address: addr.address, address2: addr.address2 || '', city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault })
    setEditingId(addr.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return
    const res = await fetch(`/api/user/addresses?phone=${user.phone}&addressId=${id}`, { method: 'DELETE' })
    if (res.ok) {
      const { addresses } = await res.json()
      setAddresses(addresses)
    }
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">My Account</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <div className="space-y-2">
            <p className="text-gray-700"><span className="font-medium">Name:</span> {user?.name || '—'}</p>
            <p className="text-gray-700"><span className="font-medium">Phone:</span> {user?.phone}</p>
            <p className="text-gray-700"><span className="font-medium">Email:</span> {user?.email || '—'}</p>
            <p className="text-gray-700"><span className="font-medium">Loyalty Points:</span> {user?.loyaltyPoints || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Saved Addresses</h2>
            <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ label: '', name: user.name || '', phone: user.phone || '', address: '', address2: '', city: '', state: '', pincode: '', isDefault: addresses.length === 0 }) }} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
              + Add Address
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select name="label" value={formData.label} onChange={handleInputChange} className="px-3 py-2 border rounded-md" required>
                  <option value="">Select Label</option>
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
                <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} className="px-3 py-2 border rounded-md" required />
                <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleInputChange} className="px-3 py-2 border rounded-md" required />
                <input type="text" name="address" placeholder="Address Line 1" value={formData.address} onChange={handleInputChange} className="px-3 py-2 border rounded-md" required />
                <input type="text" name="address2" placeholder="Address Line 2 (Optional)" value={formData.address2} onChange={handleInputChange} className="px-3 py-2 border rounded-md" />
                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="px-3 py-2 border rounded-md" required />
                <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleInputChange} className="px-3 py-2 border rounded-md" required />
                <input type="text" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleInputChange} className="px-3 py-2 border rounded-md" required />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} />
                Set as default address
              </label>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <p className="text-gray-500">No saved addresses yet.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={`${addr.id}-${addr.address.replace(/\s+/g, '')}`} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{addr.name} <span className="text-gray-500">({addr.label})</span>{addr.isDefault && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Default</span>}</p>
                      <p className="text-gray-700">{addr.address}{addr.address2 && ', ' + addr.address2}</p>
                      <p className="text-gray-700">{addr.city}, {addr.state} {addr.pincode}</p>
                      <p className="text-sm text-gray-600">{addr.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(addr)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      <button onClick={() => handleDelete(addr.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}