'use client'

import { useEffect, useState, useRef } from 'react'

interface PricingTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  sortOrder: number
  isDefault: boolean
  rules: any[]
  products: any[]
}

interface MasterVariant {
  id: string
  value: string
  label: string
  unit: {
    code: string
    type: string
  }
}

interface RulePercentage {
  variantId: string
  percentage: number
}

export default function AdminPricingTemplatesPage() {
  const [templates, setTemplates] = useState<PricingTemplate[]>([])
  const [variants, setVariants] = useState<MasterVariant[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PricingTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    sortOrder: 0,
    isDefault: false
  })
  const [rulePercentages, setRulePercentages] = useState<RulePercentage[]>([])
  const initializedRef = useRef(false)

  const fetchData = async () => {
    try {
      setError(null)
      const [templatesRes, variantsRes] = await Promise.all([
        fetch('/api/admin/pricing-templates'),
        fetch('/api/admin/variants?activeOnly=true')
      ])
      if (templatesRes.ok) setTemplates(await templatesRes.json())
      if (variantsRes.ok) setVariants(await variantsRes.json())
    } catch {
      setError('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    initializedRef.current = false
  }, [showForm])

  useEffect(() => {
    if (showForm && variants.length > 0 && !initializedRef.current) {
      initializedRef.current = true
      if (!editingTemplate) {
        setRulePercentages(variants.map(v => ({ variantId: v.id, percentage: 100 })))
      } else {
        const rules = editingTemplate.rules ?? []
        const existingPercentages = rules.map((r: any) => ({
          variantId: r.variantId,
          percentage: r.percentage
        }))
        const allVariantPercentages = variants.map(v => {
          const existing = existingPercentages.find(r => r.variantId === v.id)
          return {
            variantId: v.id,
            percentage: existing ? existing.percentage : 100
          }
        })
        setRulePercentages(allVariantPercentages)
      }
    }
  }, [showForm, variants, editingTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingTemplate ? `/api/admin/pricing-templates/${editingTemplate.id}` : '/api/admin/pricing-templates'
      const method = editingTemplate ? 'PUT' : 'POST'

      const rules = rulePercentages
        .filter(r => r.percentage > 0)
        .map((r, index) => ({
          variantId: r.variantId,
          percentage: r.percentage,
          sortOrder: index
        }))

      const body = { ...formData, rules }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        fetchData()
        setShowForm(false)
        setEditingTemplate(null)
        setFormData({ name: '', slug: '', description: '', isActive: true, sortOrder: 0, isDefault: false })
        setRulePercentages([])
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        alert(err.error || 'Failed to save')
      }
    } catch {
      alert('Something went wrong while saving the template.')
    } finally {
      setSaving(false)
    }
  }

const handleEdit = (template: PricingTemplate) => {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        slug: template.slug,
        description: template.description || '',
        isActive: template.isActive,
        sortOrder: template.sortOrder,
        isDefault: template.isDefault
      })
      setShowForm(true)
    }

  const handleAddNew = () => {
    setShowForm(true)
    setEditingTemplate(null)
    setFormData({ name: '', slug: '', description: '', isActive: true, sortOrder: 0, isDefault: false })
    setRulePercentages([])
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTemplate(null)
    setFormData({ name: '', slug: '', description: '', isActive: true, sortOrder: 0, isDefault: false })
    setRulePercentages([])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/pricing-templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        alert(err.error || 'Failed to delete')
      }
    } catch {
      alert('Something went wrong while deleting the template.')
    }
  }

  const handlePercentageChange = (variantId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setRulePercentages(prev => {
      const existing = prev.find(r => r.variantId === variantId)
      if (existing) {
        return prev.map(r => r.variantId === variantId ? { ...r, percentage: numValue } : r)
      }
      return [...prev, { variantId, percentage: numValue }]
    })
  }

  const getPercentage = (variantId: string) => {
    const rule = rulePercentages.find(r => r.variantId === variantId)
    return rule ? rule.percentage : 100
  }

  const weightVariants = variants.filter(v => v.unit.type === 'weight')
  const quantityVariants = variants.filter(v => v.unit.type === 'quantity')
  const packVariants = variants.filter(v => v.unit.type === 'pack')
  const volumeVariants = variants.filter(v => v.unit.type === 'volume')

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pricing Templates</h1>
        <button
              onClick={handleAddNew}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl font-semibold"
            >
          + Add Template
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
              {editingTemplate ? 'Edit Template' : 'Add New Template'}
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              X
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Premium"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  placeholder="e.g. premium"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Template description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  rows={2}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Is Default</label>
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Variant Pricing</h3>
              <p className="text-sm text-gray-600 mb-4">Set pricing percentages for each variant. Base price × percentage / 100 = Variant price</p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Weight Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weightVariants.map(v => (
                      <div key={v.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{v.label}</div>
                          <div className="text-xs text-gray-500">{v.unit.type}</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={getPercentage(v.id)}
                          onChange={(e) => handlePercentageChange(v.id, e.target.value)}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quantity Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quantityVariants.map(v => (
                      <div key={v.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{v.label}</div>
                          <div className="text-xs text-gray-500">{v.unit.type}</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={getPercentage(v.id)}
                          onChange={(e) => handlePercentageChange(v.id, e.target.value)}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Pack Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packVariants.map(v => (
                      <div key={v.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{v.label}</div>
                          <div className="text-xs text-gray-500">{v.unit.type}</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={getPercentage(v.id)}
                          onChange={(e) => handlePercentageChange(v.id, e.target.value)}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Volume Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {volumeVariants.map(v => (
                      <div key={v.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{v.label}</div>
                          <div className="text-xs text-gray-500">{v.unit.type}</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={getPercentage(v.id)}
                          onChange={(e) => handlePercentageChange(v.id, e.target.value)}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingTemplate ? 'Save Changes' : 'Add Template')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 border rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pricing templates found. Add your first template to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{template.slug}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{template.rules?.length || 0} rules</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{template.sortOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {template.isDefault && <span className="text-xs text-yellow-600 font-medium">Default</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
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