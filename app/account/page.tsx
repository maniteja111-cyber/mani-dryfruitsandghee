'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    setUser(JSON.parse(userStr))
  }, [router])

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
          <h2 className="text-xl font-bold mb-4">Saved Address</h2>
          {(user?.address || user?.city) ? (
            <div className="border p-4 rounded">
              <p className="font-medium">{user?.name || 'User'}</p>
              <p className="text-gray-700">{user?.address}</p>
              <p className="text-gray-700">{user?.city}, {user?.state} {user?.pincode}</p>
              <p className="text-sm text-gray-600">{user?.phone}</p>
            </div>
          ) : (
            <p className="text-gray-500">No saved address. Address will be saved when you place your first order.</p>
          )}
        </div>
      </div>
    </div>
  )
}