'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LoyaltyPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
        setPoints(userData.loyaltyPoints || 0)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (user?.phone) {
      fetchUserPoints()
    }
  }, [user])

  const fetchUserPoints = async () => {
    try {
      const res = await fetch(`/api/users?phone=${user.phone}`)
      if (res.ok) {
        const data = await res.json()
        setPoints(data.loyaltyPoints || 0)
      }
    } catch {}
  }

  const generateReferralCode = async () => {
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.referralCode) {
          const updatedUser = { ...user, referralCode: data.referralCode }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          setReferralCode(data.referralCode)
        }
      }
    } catch {}
  }

  useEffect(() => {
    setReferralCode(user?.referralCode || '')
  }, [user])

  if (!user) return null

  return (
    <>
      <Link
        href="#"
        onClick={(e) => { e.preventDefault(); setIsOpen(true) }}
        className="fixed bottom-24 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        aria-label="Loyalty Rewards"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </Link>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-4">Loyalty Rewards</h2>
            
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Your Points</p>
              <p className="text-4xl font-bold text-yellow-600">{points}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Ways To Earn</h3>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Earn 10 points for every ₹100 spent</li>
                <li>• 50 bonus points on first purchase</li>
                <li>• Daily login: 5 points</li>
              </ul>

              <h3 className="font-semibold mt-4">Ways To Redeem</h3>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• 100 points = ₹50 discount</li>
                <li>• 250 points = ₹150 discount</li>
                <li>• 500 points = ₹350 discount</li>
              </ul>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Referral Program</h4>
                <p className="text-xs text-gray-600 mb-2">Give 15% off, Get 100 points</p>
                {(user as any).referralCode || referralCode ? (
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded font-mono">{(user as any).referralCode || referralCode}</code>
                    <button 
                      onClick={() => {
                        const code = (user as any).referralCode || referralCode
                        navigator.clipboard.writeText(code)
                      }}
                      className="text-xs text-blue-600"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={generateReferralCode}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Generate Referral Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}