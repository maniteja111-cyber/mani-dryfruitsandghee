'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/app/contexts/CartContext'
import { signOut } from 'next-auth/react'
import RewardsPopup from '@/components/RewardsPopup'
import RewardsPanel from '@/components/RewardsPanel'

interface HeaderProps {
  settings: Record<string, string>
}

interface User {
  id: string
  phone: string
  name: string
  loyaltyPoints: number
  referralCode: string | null
}

export default function Header({ settings }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showRewardsPopup, setShowRewardsPopup] = useState(false)
  const [showRewardsPanel, setShowRewardsPanel] = useState(false)
  const { itemCount } = useCart()

  useEffect(() => {
    const loadUser = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr)
          setUser({
            id: parsed.id,
            phone: parsed.phone,
            name: parsed.name,
            loyaltyPoints: parsed.loyaltyPoints || 0,
            referralCode: parsed.referralCode || null
          })
          // Fetch fresh points from server and check daily bonus
          fetch(`/api/users/daily-bonus?phone=${parsed.phone}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && data.loyaltyPoints !== undefined) {
                const updated = { ...parsed, loyaltyPoints: data.loyaltyPoints, referralCode: data.referralCode }
                localStorage.setItem('user', JSON.stringify(updated))
                setUser({
                  id: updated.id,
                  phone: updated.phone,
                  name: updated.name,
                  loyaltyPoints: updated.loyaltyPoints,
                  referralCode: updated.referralCode || null
                })
                if (data.bonusAwarded) {
                  alert('🎉 Bonus awarded! You earned 5 loyalty points for today\'s login.')
                }
              }
            })
            .catch(() => {})
        } catch {}
      } else {
        setUser(null)
      }
    }
    loadUser()

    // Listen for login updates from popups
    window.addEventListener('storage', loadUser)
    window.addEventListener('userLogin', loadUser)
    
    const handleOpenRewardsPanel = () => setShowRewardsPanel(true)
    const handleOpenRewardsPopup = () => setShowRewardsPopup(true)
    window.addEventListener('openRewardsPanel', handleOpenRewardsPanel)
    window.addEventListener('openRewardsPopup', handleOpenRewardsPopup)
    return () => {
      window.removeEventListener('storage', loadUser)
      window.removeEventListener('userLogin', loadUser)
      window.removeEventListener('openRewardsPanel', handleOpenRewardsPanel)
      window.removeEventListener('openRewardsPopup', handleOpenRewardsPopup)
    }
  }, [])

  const handleRewardsClick = () => {
    if (user) {
      setShowRewardsPanel(true)
    } else {
      setShowRewardsPopup(true)
    }
  }

  const handleLogout = () => {
    const token = localStorage.getItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    if (token && token.startsWith('nextauth-')) {
      signOut({ callbackUrl: '/' })
    } else {
      window.location.href = '/'
    }
  }

return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              {settings.logo && settings.logo !== '' ? (
                <Image src={settings.logo} alt={settings.siteName || 'Logo'} width={40} height={40} className="h-10 w-auto" />
              ) : (
                <span className="text-lg font-bold truncate max-w-[200px]" style={{ color: '#f59e0b' }}>
                  {settings.siteName || 'MANI DRY FRUITS'}
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="hover:underline text-sm text-yellow-600">Home</Link>
              <Link href="/products" className="hover:underline text-sm text-yellow-600">Products</Link>
              <Link href="/categories" className="hover:underline text-sm text-yellow-600">Categories</Link>
              <Link href="/about-us" className="hover:underline text-sm text-yellow-600">About Us</Link>
              <Link href="/contact" className="hover:underline text-sm text-yellow-600">Contact</Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Rewards Button */}
              <button onClick={handleRewardsClick} formNoValidate className="relative p-2 rounded-full hover:bg-yellow-500/10 transition" title="Loyalty Rewards">
                <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                {user && user.loyaltyPoints > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {user.loyaltyPoints > 99 ? '99' : user.loyaltyPoints}
                  </span>
                )}
              </button>

              {/* Cart */}
              <Link href="/cart" className="relative p-2">
                <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 002 2v6a2 2 0 002 2z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User section */}
              {user ? (
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/account" className="text-sm font-medium text-yellow-600">Account</Link>
                  <Link href="/my-orders" className="text-sm font-medium text-yellow-600">My Orders</Link>
                  <span className="text-sm text-gray-600">Hi, {user.name?.split(' ')[0] || 'User'}</span>
                  <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Logout</button>
                </div>
              ) : (
<button onClick={() => setShowRewardsPopup(true)} formNoValidate className="hidden md:block text-sm font-medium px-3 py-1.5 rounded-lg bg-yellow-600 text-white">
                   Login
                 </button>
              )}

              {/* Mobile menu */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} formNoValidate className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3">
              <nav className="flex flex-col space-y-2">
                <Link href="/" className="px-2 py-1.5 hover:underline text-yellow-600">Home</Link>
                <Link href="/products" className="px-2 py-1.5 hover:underline text-yellow-600">Products</Link>
                <Link href="/categories" className="px-2 py-1.5 hover:underline text-yellow-600">Categories</Link>
                <Link href="/about-us" className="px-2 py-1.5 hover:underline text-yellow-600">About Us</Link>
                <Link href="/contact" className="px-2 py-1.5 hover:underline text-yellow-600">Contact</Link>
                <hr className="border-gray-200" />
                {user ? (
                  <>
                    <Link href="/account" className="px-2 py-1.5 font-medium hover:underline text-yellow-600">Account</Link>
                    <Link href="/my-orders" className="px-2 py-1.5 font-medium hover:underline text-yellow-600">My Orders</Link>
                    <button onClick={handleLogout} className="px-2 py-1.5 text-left text-red-600">Logout</button>
                  </>
                ) : (
                  <button onClick={() => { setShowRewardsPopup(true); setIsMenuOpen(false); }} className="px-2 py-1.5 text-left font-medium text-yellow-600">Login / Register</button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Rewards Popup (for non-logged-in users) */}
      <RewardsPopup
        isOpen={showRewardsPopup}
        onClose={() => setShowRewardsPopup(false)}
        onLoginSuccess={(userData) => {
          localStorage.setItem('user', JSON.stringify(userData))
          setUser({
            id: userData.id,
            phone: userData.phone,
            name: userData.name,
            loyaltyPoints: userData.loyaltyPoints,
            referralCode: userData.referralCode || null
          })
          window.dispatchEvent(new Event('userLogin'))
        }}
      />

      {/* Rewards Panel (for logged-in users) */}
      <RewardsPanel
        isOpen={showRewardsPanel}
        onClose={() => setShowRewardsPanel(false)}
      />
    </>
  )
}
