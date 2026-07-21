'use client'

import { useEffect, useState } from 'react'

interface MasterUnit {
  id: string
  code: string
  name: string
  type: string
  symbol: string
  sortOrder: number
  isActive: boolean
}

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<MasterUnit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<MasterUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'weight',
    symbol: '',
    sortOrder: 0
  })

  const fetchData = async () => {
    try {
      setError(null)
      const res = await fetch('/api/admin/units')
      if (res.ok) {
        setUnits(await res.json())
      } else {
        setError('Failed to load units')
      }
    } catch {
      setError('Error fetching units')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingUnit ? `/api/admin/units/${editingUnit.id}` : '/api/admin/units'
      const method = editingUnit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchData()
        setShowForm(false)
        setEditingUnit(null)
        setFormData({ code: '', name: '', type: 'weight', symbol: '', sortOrder: 0 })
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        alert(err.error || 'Failed to save')
      }
    } catch {
      alert('Something went wrong while saving the unit.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (unit: MasterUnit) => {
    setEditingUnit(unit)
    setFormData({
      code: unit.code,
      name: unit.name,
      type: unit.type,
      symbol: unit.symbol,
      sortOrder: unit.sortOrder
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/units/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        alert(err.error || 'Failed to delete')
      }
    } catch {
      alert('Something went wrong while deleting the unit.')
    }
  }

  const unitTypes = [
    { value: 'weight', label: 'Weight', description: 'Products sold by weight (grams, kg)' },
    { value: 'quantity', label: 'Quantity', description: 'Products sold by piece' },
    { value: 'volume', label: 'Volume', description: 'Products sold by volume (liters, ml)' },
    { value: 'pack', label: 'Pack', description: 'Products sold in packs' }
  ]

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Units</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingUnit(null)
            setFormData({ code: '', name: '', type: 'weight', symbol: '', sortOrder: 0 })
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl font-semibold"
        >
          + Add Unit
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow mb-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingUnit ? 'Edit Unit' : 'Add New Unit'}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingUnit(null); setFormData({ code: '', name: '', type: 'weight', symbol: '', sortOrder: 0 }) }}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              X
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Code *</label>
                <input
                  type="text"
                  placeholder="e.g. g, piece"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                  disabled={!!editingUnit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                  disabled={!!editingUnit}
                >
                  {unitTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Gram, Piece"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. g, pc, l"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingUnit ? 'Save Changes' : 'Add Unit')}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingUnit(null); setFormData({ code: '', name: '', type: 'weight', symbol: '', sortOrder: 0 }) }}
                className="px-8 py-3 border rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {units.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No units found. Add your first unit to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{unit.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{unit.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.sortOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${unit.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {unit.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(unit)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(unit.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}