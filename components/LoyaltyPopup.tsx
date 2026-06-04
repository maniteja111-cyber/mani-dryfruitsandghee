'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  phone: string
  name: string
  loyaltyPoints: number
  referralCode?: string
  referredBy?: string
}

export default function LoyaltyPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [points, setPoints] = useState(0)
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser({
          id: userData.id,
          phone: userData.phone,
          name: userData.name,
          loyaltyPoints: userData.loyaltyPoints || 0,
          referralCode: userData.referralCode,
          referredBy: userData.referredBy
        })
        setPoints(userData.loyaltyPoints || 0)
        if (userData.referralCode) {
          setReferralCode(userData.referralCode)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!user?.phone) return
    fetch(`/api/users?phone=${user.phone}`)
      .then(res => res.json())
      .then(data => setPoints(data.loyaltyPoints || 0))
      .catch(() => {})
  }, [user?.phone])

  const generateReferralCode = async () => {
    if (!user?.phone) return
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.referralCode) {
          setReferralCode(data.referralCode)
        }
      }
    } catch {}
  }

  const copyReferralLink = () => {
    const code = user?.referralCode || referralCode
    if (code) {
      const link = `${window.location.origin}/login?ref=${code}`
      navigator.clipboard.writeText(link)
    }
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className="fixed bottom-24 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
          aria-label="Loyalty Rewards - Login to access"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </Link>
      </>
    )
  }

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
                <p className="text-xs text-gray-600 mb-2">Share your code, give 15% off & get 100 points per referral</p>
                {user.referralCode || referralCode ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded font-mono flex-1">{user.referralCode || referralCode}</code>
                      <button 
                        onClick={() => navigator.clipboard.writeText(user.referralCode || referralCode)}
                        className="text-xs text-blue-600"
                      >
                        Copy Code
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded font-mono text-xs flex-1 truncate">
                        {`${window.location.origin}/login?ref=${user.referralCode || referralCode}`}
                      </code>
                      <button 
                        onClick={copyReferralLink}
                        className="text-xs text-blue-600"
                      >
                        Copy Link
                      </button>
                    </div>
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