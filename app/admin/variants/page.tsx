'use client'

import { useEffect, useState } from 'react'

interface MasterUnit {
  id: string
  code: string
  name: string
  type: string
}

interface MasterVariant {
  id: string
  unitId: string
  value: string
  label: string
  sortOrder: number
  isActive: boolean
  unit: MasterUnit
}

export default function AdminVariantsPage() {
  const [variants, setVariants] = useState<MasterVariant[]>([])
  const [units, setUnits] = useState<MasterUnit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<MasterVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    unitId: '',
    value: '',
    label: '',
    sortOrder: 0
  })

  const fetchData = async () => {
    try {
      setError(null)
      const [variantsRes, unitsRes] = await Promise.all([
        fetch('/api/admin/variants'),
        fetch('/api/admin/units')
      ])
      if (variantsRes.ok) setVariants(await variantsRes.json())
      if (unitsRes.ok) setUnits(await unitsRes.json())
    } catch {
      setError('Error fetching data')
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
      const url = editingVariant ? `/api/admin/variants/${editingVariant.id}` : '/api/admin/variants'
      const method = editingVariant ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchData()
        setShowForm(false)
        setEditingVariant(null)
        setFormData({ unitId: '', value: '', label: '', sortOrder: 0 })
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        alert(err.error || 'Failed to save')
      }
    } catch {
      alert('Something went wrong while saving the variant.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (variant: MasterVariant) => {
    setEditingVariant(variant)
    setFormData({
      unitId: variant.unitId,
      value: variant.value,
      label: variant.label,
      sortOrder: variant.sortOrder
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/variants/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        alert(err.error || 'Failed to delete')
      }
    } catch {
      alert('Something went wrong while deleting the variant.')
    }
  }

  const selectedUnit = units.find(u => u.id === formData.unitId)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Variants</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingVariant(null)
            setFormData({ unitId: '', value: '', label: '', sortOrder: 0 })
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl font-semibold"
        >
          + Add Variant
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
              {editingVariant ? 'Edit Variant' : 'Add New Variant'}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingVariant(null); setFormData({ unitId: '', value: '', label: '', sortOrder: 0 }) }}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              X
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                  disabled={!!editingVariant}
                >
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                <input
                  type="text"
                  placeholder="e.g. 125"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  type="text"
                  placeholder="e.g. 125g"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
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

            {selectedUnit && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Unit:</strong> {selectedUnit.name} ({selectedUnit.type})
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingVariant ? 'Save Changes' : 'Add Variant')}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingVariant(null); setFormData({ unitId: '', value: '', label: '', sortOrder: 0 }) }}
                className="px-8 py-3 border rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {variants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No variants found. Add your first variant to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant) => (
                <tr key={variant.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{variant.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{variant.unit?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{variant.unit?.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.sortOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {variant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(variant)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id)}
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