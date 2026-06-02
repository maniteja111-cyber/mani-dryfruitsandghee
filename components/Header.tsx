'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/app/contexts/CartContext'

interface HeaderProps {
  settings: Record<string, string>
}

export default function Header({ settings }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { itemCount } = useCart()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr)
        setUser(parsed)
      } catch {}
    }
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {settings.logo && settings.logo !== '' ? (
              <Image
                src={settings.logo}
                alt={settings.siteName || 'Logo'}
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: settings.themeColor || '#374151' }}
              >
                {settings.siteName || 'Mani Dry Fruits'}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" style={{ color: settings.themeColor || '#374151' }} className="hover:underline">Home</Link>
            <Link href="/products" style={{ color: settings.themeColor || '#374151' }} className="hover:underline">Products</Link>
            <Link href="/categories" style={{ color: settings.themeColor || '#374151' }} className="hover:underline">Categories</Link>
            <Link href="/about" style={{ color: settings.themeColor || '#374151' }} className="hover:underline">About</Link>
            <Link href="/contact" style={{ color: settings.themeColor || '#374151' }} className="hover:underline">Contact</Link>
          </nav>

              {/* Right side */}
            <div className="flex items-center space-x-4">
              <Link href="/cart" style={{ color: settings.themeColor || '#374151' }} className="relative">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 002 2v6a2 2 0 002 2z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

             {/* User / Login section */}
             {user ? (
               <>
                 <Link 
                   href="/my-orders" 
                   className="hidden md:block font-medium"
                   style={{ color: settings.themeColor || '#374151' }}
                 >
                   My Orders
                 </Link>
                 <span className="text-sm text-gray-600 hidden md:block">
                   Hi, {user.name?.split(' ')[0] || 'User'}
                 </span>
                 <button
                   onClick={() => {
                     localStorage.removeItem('user')
                     localStorage.removeItem('token')
                     window.location.href = '/'
                   }}
                   className="text-sm hover:underline hidden md:block"
                   style={{ color: settings.themeColor || '#dc2626' }}
                 >
                   Logout
                 </button>
               </>
             ) : (
               <Link 
                 href="/login" 
                 className="hidden md:block"
                 style={{ color: settings.themeColor || '#374151' }}
               >
                 Login
               </Link>
             )}

             {/* Mobile menu button */}
             <button
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
             >
               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </button>
           </div>
        </div>

         {/* Mobile Navigation */}
         {isMenuOpen && (
           <div className="md:hidden border-t border-gray-200 py-2">
              <nav className="flex flex-col space-y-2">
                <Link href="/" style={{ color: settings.themeColor || '#374151' }} className="px-2 py-1 hover:underline">Home</Link>
                <Link href="/products" style={{ color: settings.themeColor || '#374151' }} className="px-2 py-1 hover:underline">Products</Link>
                <Link href="/categories" style={{ color: settings.themeColor || '#374151' }} className="px-2 py-1 hover:underline">Categories</Link>
                <Link href="/about" style={{ color: settings.themeColor || '#374151' }} className="px-2 py-1 hover:underline">About</Link>
                <Link href="/contact" style={{ color: settings.themeColor || '#374151' }} className="px-2 py-1 hover:underline">Contact</Link>

                 {user ? (
                   <>
                     <Link href="/my-orders" style={{ color: settings.themeColor || '#374151' }} className="px-2 py-1 font-medium hover:underline">My Orders</Link>
                     <button
                       onClick={() => {
                         localStorage.removeItem('user')
                         localStorage.removeItem('token')
                         window.location.href = '/'
                       }}
                       className="px-2 py-1 text-left text-red-600 hover:text-red-700"
                     >
                       Logout
                     </button>
                   </>
                 ) : (
                  <Link href="/login" style={{ color: settings.themeColor || '#374151' }} className="px-2 py-1 hover:underline">Login</Link>
                )}
              </nav>
           </div>
         )}
      </div>
    </header>
  )
}