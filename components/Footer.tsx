'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface FooterProps {
  settings: Record<string, string>
}

export default function Footer({ settings }: FooterProps) {
  const [totalVisits, setTotalVisits] = useState(0)

  useEffect(() => {
    fetch('/api/visits', { method: 'POST' })
      .then(res => res.json())
      .then(data => setTotalVisits(data.totalVisits || 0))
      .catch(() => {})
  }, [])

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">
            {settings.siteName || 'MANI DRY FRUITS, PICKLES AND GHEE STORES'}
          </h3>
          <p className="text-gray-300 dark:text-gray-400">Healthy products delivered to your doorstep</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-md font-semibold mb-4 dark:text-gray-200">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200">Home</Link></li>
              <li><Link href="/products" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200">Products</Link></li>
              <li><Link href="/categories" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200">Categories</Link></li>
              <li><Link href="/contact" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200">Contact</Link></li>
            </ul>
          </div>
          <div className="text-center">
            <h4 className="text-md font-semibold mb-4 dark:text-gray-200">Contact</h4>
            <div className="text-sm text-gray-300 dark:text-gray-400 space-y-2">
              <p>📞 {settings.phone || '+91 9515019393'}</p>
              <p>✉️ {settings.email || 'manidgs9393@gmail.com'}</p>
              <p>📍 Hyderabad, Telangana</p>
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-md font-semibold mb-4 dark:text-gray-200">Site Stats</h4>
            <p className="text-2xl font-bold text-yellow-400">{totalVisits.toLocaleString()}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Total Visitors</p>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} {settings.siteName || 'MANI DRY FRUITS, PICKLES AND GHEE STORES'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}