'use client'

import { useEffect, useState } from 'react'

// TODO: auth check handled by admin layout — remove guard from here once layout is verified

export default function AdminPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pendingOrders: 0, lowStock: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/orders')
      ])

      const products = productsRes.ok ? await productsRes.json() : []
      const orders = ordersRes.ok ? await ordersRes.json() : []

      const revenue = orders.reduce((sum: number, order: any) => sum + order.total, 0)
      const pending = orders.filter((o: any) => o.status === 'pending').length
      const lowStockItems = products.filter((p: any) => p.stock > 0 && p.stock <= 10)

      setStats({
        products: products.length,
        orders: orders.length,
        revenue,
        pendingOrders: pending,
        lowStock: lowStockItems.length
      })

      setRecentOrders(orders.slice(0, 5))
      setLowStockProducts(lowStockItems.slice(0, 6))
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, Admin 👋</p>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-sm text-gray-500">Total Products</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.products}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-sm text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.orders}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-sm text-gray-500">Pending Orders</h3>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-sm text-gray-500">Low Stock</h3>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.lowStock}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-sm text-gray-500">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600 mt-1">₹{stats.revenue}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        <div className="font-medium">{order.name}</div>
                        <div className="text-xs text-gray-500">#{order.id.slice(0, 8)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{order.total}</div>
                        <div className="text-xs capitalize text-gray-500">{order.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No orders yet</p>
              )}
              <a href="/admin/orders" className="block mt-4 text-yellow-600 hover:underline text-sm">View All Orders →</a>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white rounded-2xl shadow p-6 border border-red-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-600">Low Stock Alert ({stats.lowStock})</h2>
                <a href="/admin/products" className="text-sm text-red-600 hover:underline font-medium">View All →</a>
              </div>

              {lowStockProducts.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {lowStockProducts.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center border-b pb-1.5 last:border-0">
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-red-600 font-semibold">({p.stock} left)</span>
                      </div>
                      <a
                        href={`/admin/products`}
                        className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                      >
                        Edit
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-600 text-sm">All products have healthy stock levels ✓</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <a href="/admin/products" className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                  Manage Products
                </a>
                <a href="/admin/categories" className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                  Manage Categories
                </a>
                <a href="/admin/orders" className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                  View Orders
                </a>
                <a href="/admin/coupons" className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                  Manage Coupons
                </a>
                <a href="/admin/settings" className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                  Website Settings
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <p className="text-gray-500">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
