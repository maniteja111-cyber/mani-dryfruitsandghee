'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  phone: string
  name: string | null
  email: string | null
  loyaltyPoints: number
  referralCode: string | null
  referredBy: string | null
  firstPurchase: boolean
  createdAt: string
  _count?: { orders: number }
}

interface Transaction {
  id: string
  points: number
  type: string
  description: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

  const checkAuth = () => {
    const user = localStorage.getItem('user')
    if (!user) { router.push('/login'); return }
    const userData = JSON.parse(user)
    if (userData.phone !== '9999999999') { router.push('/'); return }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/transactions`)
      if (res.ok) setTransactions(await res.json())
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user)
    fetchTransactions(user.id)
  }

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !adjustPoints) return

    const points = parseInt(adjustPoints)
    if (isNaN(points)) return

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/adjust-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason: adjustReason || 'Manual adjustment' })
      })
      if (res.ok) {
        fetchUsers()
        setSelectedUser(null)
        setShowAdjust(false)
        setAdjustPoints('')
        setAdjustReason('')
      }
    } catch (error) {
      console.error('Error adjusting points:', error)
    }
  }

  const filteredUsers = users.filter(u =>
    u.phone.includes(search) || u.name?.toLowerCase().includes(search.toLowerCase()) || u.referralCode?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPoints = users.reduce((sum, u) => sum + u.loyaltyPoints, 0)
  const totalUsers = users.length

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Users & Loyalty Points</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Points Outstanding</p>
            <p className="text-2xl font-bold text-yellow-600">{totalPoints.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Avg Points/User</p>
            <p className="text-2xl font-bold text-green-600">{totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0}</p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by phone, name, or referral code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} onClick={() => handleUserClick(user)} className="hover:bg-yellow-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{user.phone}</td>
                  <td className="px-4 py-3 text-sm">
                    {user.email ? (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.57-3.09 3.57-5.09z"/>
                          <path fill="currentColor" d="M12 22c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 22 12 22z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </span>
                    ) : (
                      <span className="text-gray-600">Phone</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{user.referralCode || '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-yellow-600">{user.loyaltyPoints}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedUser(null); setShowAdjust(false); }}>
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.name || 'User'}</h2>
                    <p className="text-gray-500">{selectedUser.phone}</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setShowAdjust(false); }} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">Loyalty Points</p>
                    <p className="text-3xl font-bold text-yellow-600">{selectedUser.loyaltyPoints}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700">Referral Code</p>
                    <p className="text-xl font-bold text-blue-600 font-mono">{selectedUser.referralCode || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">Auth Method</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedUser.email ? 'Google' : 'Phone'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-700">Member Since</p>
                    <p className="text-lg font-semibold text-purple-800">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {!showAdjust ? (
                  <button onClick={() => setShowAdjust(true)} className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 mb-4">
                    Adjust Points
                </button>
                ) : (
                  <form onSubmit={handleAdjustPoints} className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-3">Adjust Points</h3>
                    <input type="number" placeholder="Points (+ to add, - to deduct)" value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)} className="w-full border rounded px-3 py-2 mb-2" required />
                    <input type="text" placeholder="Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-full border rounded px-3 py-2 mb-2" />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Apply</button>
                      <button type="button" onClick={() => setShowAdjust(false)} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">Cancel</button>
                    </div>
                  </form>
                )}

                <h3 className="font-semibold mb-2">Point History</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {transactions.length > 0 ? transactions.map((t) => (
                    <div key={t.id} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{t.description || t.type}</p>
                        <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`font-bold ${t.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.points >= 0 ? '+' : ''}{t.points}
                      </span>
                    </div>
                  )) : <p className="text-gray-500 text-sm">No transactions yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
