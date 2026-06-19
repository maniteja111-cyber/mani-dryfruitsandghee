'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import RewardsPopup from '@/components/RewardsPopup'
import RewardsPanel from '@/components/RewardsPanel'

interface RewardsButtonProps {
  phone: string
}

export default function RewardsButton({ phone }: RewardsButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch {}
    }
    window.addEventListener('userLogin', () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          setUser(JSON.parse(userStr))
        } catch {}
      }
    })
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        setShowPopup(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleRewardsClick = () => {
    if (user) {
      setShowPopup(true)
    } else {
      setIsMenuOpen(true)
    }
  }

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
    setIsMenuOpen(false)
    setShowPopup(true)
  }

  const handleLogout = () => {
    const token = localStorage.getItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setIsMenuOpen(false)
    if (token && token.startsWith('nextauth-')) {
      signOut({ callbackUrl: '/' })
    }
  }

  return (
    <>
      <button
        onClick={handleRewardsClick}
        className="fixed bottom-6 right-6 bg-yellow-500 hover:bg-yellow-600 text-white p-3.5 rounded-full shadow-lg transition-colors z-50 flex items-center justify-center"
        aria-label="Loyalty Rewards"
      >
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        {user && user.loyaltyPoints > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-yellow-600 text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold border border-yellow-400">
            {user.loyaltyPoints > 99 ? '99' : user.loyaltyPoints}
          </span>
        )}
      </button>

      <div className="fixed bottom-20 right-6 z-50 md:hidden">
        {isMenuOpen && (
          <div className="bg-white rounded-lg shadow-xl p-4 min-w-[200px] border border-gray-200">
            {user ? (
              <>
                <div className="text-center mb-3">
                  <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user.phone}</p>
                  <p className="text-lg font-bold text-yellow-600 mt-1">{user.loyaltyPoints} pts</p>
                </div>
                <button
                  onClick={() => { setShowPopup(true); setIsMenuOpen(false); }}
                  className="w-full py-2 text-sm text-left text-gray-700 hover:bg-yellow-50 rounded px-2 mb-1"
                >
                  View Rewards
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded px-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowPopup(true); setIsMenuOpen(false); }}
                className="w-full py-2 text-sm text-center bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Login / Register
              </button>
            )}
          </div>
        )}
      </div>

      <RewardsPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <RewardsPanel
        isOpen={showPopup && user}
        onClose={() => setShowPopup(false)}
      />
    </>
  )
}