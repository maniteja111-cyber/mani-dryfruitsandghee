'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    if (userData.phone !== '9999999999') {
      router.push('/')
      return
    }
    setUser(userData)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/login')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/products/bulk-upload', label: 'Bulk Upload' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/coupons', label: 'Coupons' },
    { href: '/admin/reviews', label: 'Reviews' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/variants', label: 'Variants' },
    { href: '/admin/units', label: 'Units' },
    { href: '/admin/pricing-templates', label: 'Pricing Templates' },
    { href: '/admin/gift-boxes', label: 'Gift Boxes' },
    { href: '/admin/settings', label: 'Settings' },
  ]

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Checking access...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Mani Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Dry Fruits • Pickles • Ghee</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="text-sm text-gray-600 mb-3">
            Logged in as<br />
            <span className="font-semibold text-gray-900">{user.name || user.phone}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {navItems.find(i => pathname.startsWith(i.href))?.label || 'Admin'}
            </h2>
          </div>
          <div className="text-sm text-gray-500">
            manidryfruitsandghee.in
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
