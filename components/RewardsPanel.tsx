'use client'

import { useState, useEffect } from 'react'

interface RewardsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Transaction {
  id: string
  points: number
  type: string
  description: string | null
  createdAt: string
}

export default function RewardsPanel({ isOpen, onClose }: RewardsPanelProps) {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showRedeem, setShowRedeem] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr)
          setUser(parsed)
          fetchUserData(parsed.phone)
        } catch {}
      }
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const fetchUserData = async (phone: string) => {
    try {
      const res = await fetch(`/api/users?phone=${phone}`)
      if (res.ok) {
        const data = await res.json()
        setUser((prev: any) => ({ ...prev, loyaltyPoints: data.loyaltyPoints, referralCode: data.referralCode }))
      }
      const txRes = await fetch(`/api/users/${phone}/transactions`)
      if (txRes.ok) setTransactions(await txRes.json())
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/login?ref=${user?.referralCode}`
    navigator.clipboard.writeText(link)
    alert('Referral link copied! Share it with friends.')
  }

  const getReferralLink = () => {
    return `${window.location.origin}/login?ref=${user?.referralCode}`
  }

  const redeemOptions = [
    { points: 100, discount: 50 },
    { points: 250, discount: 150 },
    { points: 500, discount: 350 },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10">&times;</button>

          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-2xl p-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold text-white">Loyalty Rewards</h2>
            <div className="mt-3 bg-white/20 rounded-full px-6 py-2 inline-block">
              <span className="text-white text-sm">Your Points</span>
              <p className="text-3xl font-bold text-white">{user?.loyaltyPoints || 0}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Referral Section */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-purple-800 mb-2">👥 Refer & Earn</h3>
              <p className="text-sm text-purple-600 mb-3">Share your code, give friends 15% off & get 100 points per referral!</p>
              <div className="bg-white rounded-lg p-3 flex items-center justify-between mb-2">
                <code className="text-lg font-bold text-purple-700">{user?.referralCode || '—'}</code>
                <button onClick={copyReferralLink} className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700">
                  Copy Link
                </button>
              </div>
              <p className="text-xs text-purple-500 break-all">{getReferralLink()}</p>
            </div>

            {/* Ways to Earn */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Ways to Earn</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl">📅</p>
                  <p className="text-xs font-medium text-yellow-700">Daily Login</p>
                  <p className="text-lg font-bold text-yellow-600">+5</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl">🛒</p>
                  <p className="text-xs font-medium text-green-700">Per ₹100 Spent</p>
                  <p className="text-lg font-bold text-green-600">+10</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl">🎁</p>
                  <p className="text-xs font-medium text-blue-700">First Purchase</p>
                  <p className="text-lg font-bold text-blue-600">+50</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl">👥</p>
                  <p className="text-xs font-medium text-purple-700">Per Referral</p>
                  <p className="text-lg font-bold text-purple-600">+100</p>
                </div>
              </div>
            </div>

            {/* Redeem */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Redeem Points</h3>
              <div className="space-y-2">
                {redeemOptions.map((opt) => (
                  <div key={opt.points} className={`flex items-center justify-between rounded-lg p-3 border-2 transition ${(user?.loyaltyPoints || 0) >= opt.points ? 'border-green-300 bg-green-50 cursor-pointer hover:bg-green-100' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                    <div>
                      <p className="font-semibold">{opt.points} points</p>
                      <p className="text-sm text-gray-500">₹{opt.discount} discount</p>
                    </div>
                    <span className={`text-sm font-medium ${(user?.loyaltyPoints || 0) >= opt.points ? 'text-green-600' : 'text-gray-400'}`}>
                      {(user?.loyaltyPoints || 0) >= opt.points ? 'Available ✓' : `Need ${opt.points - (user?.loyaltyPoints || 0)} more`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Use points at checkout to redeem discounts.</p>
            </div>

            {/* Transaction History */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {transactions.length > 0 ? transactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{t.description || t.type}</p>
                      <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold text-sm ${t.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.points >= 0 ? '+' : ''}{t.points}
                    </span>
                  </div>
                )) : <p className="text-gray-500 text-sm text-center py-4">No activity yet. Start earning!</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
