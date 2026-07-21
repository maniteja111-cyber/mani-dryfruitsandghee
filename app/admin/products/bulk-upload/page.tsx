'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import ProductForm from '@/components/ProductForm'

interface ValidationError {
  row: number
  column: string
  message: string
}

interface ValidationResponse {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  errors: ValidationError[]
  parsedData?: any[]
}

interface ImportResponse {
  success: boolean
  imported: number
  failed: number
  skipped: number
  errors: { row: number; message: string }[]
}

interface ProductRow {
  id: string
  name: string
  slug: string
  category: string
  description: string
  shortDescription: string
  pricePerKg: number
  stockKg: number
  images: string
  basePrice: number
  pricingTemplate: string
  stockQuantity: number
  productType: 'weight' | 'quantity' | 'pack' | 'volume'
  variants: string
  isFeatured: boolean
  isTodayOffer: boolean
  isVisible: boolean
  seoKeywords: string
  faqs: string
  ingredients: string
  benefits: string
  storageInstructions: string
  shelfLife: string
  origin: string
  shippingInfo: string
  whyChoose: string
  productOverview: string
  nutritionalInfo: string
  isValid: boolean
  errors: string[]
  isDuplicate: boolean
  duplicateType: 'name' | 'slug' | null
  existingProductSlug: string | null
  status: 'new' | 'existing' | 'duplicate'
  skip: boolean
}

const PRODUCT_TYPES = [
  { value: 'weight', label: 'Weight', unitCode: 'g' },
  { value: 'quantity', label: 'Quantity', unitCode: 'piece' },
  { value: 'pack', label: 'Pack', unitCode: 'pack' },
  { value: 'volume', label: 'Volume', unitCode: 'liter' }
]

export default function BulkUploadPage() {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [validatedRows, setValidatedRows] = useState<ProductRow[]>([])
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'errors' | 'duplicates' | 'new' | 'existing'>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [pricingTemplates, setPricingTemplates] = useState<{ id: string; name: string; slug: string }[]>([])
  const [allVariants, setAllVariants] = useState<any[]>([])
  const [openProducts, setOpenProducts] = useState<Set<string>>(new Set())
  const validatedFileRef = useRef<File | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, templatesRes, variantsRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/pricing-templates'),
          fetch('/api/admin/variants?activeOnly=true')
        ])
        if (categoriesRes.ok) setCategories(await categoriesRes.json())
        if (templatesRes.ok) setPricingTemplates(await templatesRes.json())
        if (variantsRes.ok) setAllVariants(await variantsRes.json())
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        showToast('Only .xlsx files are supported', 'error')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error')
        return
      }
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setValidationResult(null)
      setImportResult(null)
      setStep(1)
      validatedFileRef.current = null
      setTextInput('')
      setValidatedRows([])
      setSelectedRows(new Set())
      setSearchTerm('')
      setFilter('all')
      setOpenProducts(new Set())
    }
  }

  const handleValidate = async () => {
    if (!file && !textInput.trim()) return

    abortControllerRef.current = new AbortController()
    setValidating(true)
    let data: ValidationResponse = { success: false, totalRows: 0, validRows: 0, invalidRows: 0, errors: [] }
    try {
      if (file) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/admin/products/bulk-upload/validate', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal
        })

        data = await res.json()
        setValidationResult(data)
        validatedFileRef.current = file
      } else {
        const lines = textInput.trim().split('\n')
        const headers = lines[0].split('\t').map(h => h.trim())
        const rows: Record<string, any>[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split('\t')
          const row: Record<string, any> = {}
          headers.forEach((header, idx) => {
            row[header] = values[idx] || ''
          })
          rows.push(row)
        }

        const res = await fetch('/api/admin/products/bulk-upload/validate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows })
        })

        data = await res.json()
        setValidationResult(data)
        validatedFileRef.current = null
      }

      const rows: ProductRow[] = data.parsedData?.map((row, idx) => ({
        id: `row-${idx}`,
        name: row.name || '',
        slug: row.slug || '',
        category: row.category || '',
        description: row.description || '',
        shortDescription: row.shortDescription || '',
        pricePerKg: row.pricePerKg ? parseFloat(row.pricePerKg) : 0,
        stockKg: row.stockKg ? parseFloat(row.stockKg) : 0,
        images: row.images || '[]',
        basePrice: row.basePrice ? parseFloat(row.basePrice) : 0,
        pricingTemplate: row.pricingTemplate || '',
        stockQuantity: row.stockQuantity ? parseFloat(row.stockQuantity) : 0,
        productType: row.productType || 'weight',
        variants: row.variants || '',
        isFeatured: row.isFeatured === true || row.isFeatured === 'true',
        isTodayOffer: row.isTodayOffer === true || row.isTodayOffer === 'true',
        isVisible: row.isVisible !== false && row.isVisible !== 'false',
        seoKeywords: row.seoKeywords || '',
        faqs: row.faqs || '[]',
        ingredients: row.ingredients || '',
        benefits: row.benefits || '',
        storageInstructions: row.storageInstructions || '',
        shelfLife: row.shelfLife || '',
        origin: row.origin || '',
        shippingInfo: row.shippingInfo || '',
        whyChoose: row.whyChoose || '',
        productOverview: row.productOverview || '',
        nutritionalInfo: row.nutritionalInfo || '',
        isValid: true,
        errors: [],
        isDuplicate: false,
        duplicateType: null,
        existingProductSlug: null,
        status: 'new',
        skip: false
      })) || []

      setValidatedRows(rows)
      setStep(2)
      showToast(`Validation passed: ${data.validRows} products ready for review`, 'success')
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Validation error:', error)
        showToast('Validation failed. Please try again.', 'error')
      }
    } finally {
      setValidating(false)
    }
  }

  const revalidateRow = (rowId: string) => {
    const rowIndex = parseInt(rowId.split('-')[1])
    const row = validatedRows[rowIndex]
    if (!row) return

    const errors: string[] = []
    
    if (!row.name || String(row.name).trim() === '') {
      errors.push('name is required')
    }
    if (!row.category || String(row.category).trim() === '') {
      errors.push('category is required')
    }
    if (!row.productType) {
      errors.push('productType is required')
    } else if (!['weight', 'quantity', 'pack', 'volume'].includes(row.productType)) {
      errors.push('Invalid productType')
    }

    const newRows = [...validatedRows]
    newRows[rowIndex] = {
      ...row,
      errors,
      isValid: errors.length === 0
    }
    setValidatedRows(newRows)
  }

  const handleImageUpload = async (rowId: string, index: number, file: File) => {
    const formDataUpload = new FormData()
    formDataUpload.append('image', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (res.ok) {
        const { url } = await res.json()
        const rowIndex = parseInt(rowId.split('-')[1])
        const row = validatedRows[rowIndex]
        
        let images: string[] = []
        try {
          images = JSON.parse(row.images)
        } catch {
          images = []
        }
        images[index] = url
        
        const newRows = [...validatedRows]
        newRows[rowIndex] = {
          ...row,
          images: JSON.stringify(images)
        }
        setValidatedRows(newRows)
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Image upload failed', 'error')
    }
  }

  const getPricingPreview = (rowId: string) => {
    const rowIndex = parseInt(rowId.split('-')[1])
    const row = validatedRows[rowIndex]
    if (!row) return null

    if (!row.pricingTemplate || !row.basePrice || !row.variants) {
      return null
    }

    const basePrice = row.basePrice || 0
    const variantIds = row.variants.split(',').map(v => v.trim()).filter(v => v)
    
    const selectedVariants = allVariants.filter(v => variantIds.includes(v.label))
    
    return selectedVariants.map(v => ({
      label: v.label,
      price: basePrice
    }))
  }

  const handleImport = async () => {
    if (validatedRows.length === 0) return

    const rowsToImport = validatedRows.filter(row => row.isValid && !row.skip)
    if (rowsToImport.length === 0) {
      showToast('No valid rows to import', 'error')
      return
    }

    abortControllerRef.current = new AbortController()
    setImporting(true)
    try {
      const res = await fetch('/api/admin/products/bulk-upload/import-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToImport })
      })

      const data = await res.json()
      setImportResult(data)
      setStep(4)

      if (data.success) {
        showToast(`Successfully imported ${data.imported} product(s)`, 'success')
      } else {
        showToast(`Import completed with ${data.imported} imported and ${data.failed} failed`, 'error')
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Import error:', error)
        showToast('Import failed. Please try again.', 'error')
      }
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    if (validating || importing) {
      abortControllerRef.current?.abort()
    }
    setFile(null)
    setFileName('')
    setValidationResult(null)
    setImportResult(null)
    setValidatedRows([])
    setStep(1)
    validatedFileRef.current = null
    setTextInput('')
    setSelectedRows(new Set())
    setSearchTerm('')
    setFilter('all')
    setOpenProducts(new Set())
  }

  const toggleProduct = (rowId: string) => {
    const newOpen = new Set(openProducts)
    if (newOpen.has(rowId)) {
      newOpen.delete(rowId)
    } else {
      newOpen.add(rowId)
    }
    setOpenProducts(newOpen)
  }

  const filteredRows = validatedRows.filter(row => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!row.name.toLowerCase().includes(searchLower) &&
          !row.slug.toLowerCase().includes(searchLower) &&
          !row.category.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    
    switch (filter) {
      case 'errors': return !row.isValid
      case 'duplicates': return row.isDuplicate
      case 'new': return !row.isDuplicate && row.isValid
      case 'existing': return row.isDuplicate
      default: return true
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
        <a
          href="/api/admin/products/bulk-template"
          download="bulk-products-template.xlsx"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 self-start"
        >
          📥 Download Template
        </a>
      </div>

      {toast && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between animate-slide-down ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-4 text-lg leading-none hover:opacity-70">×</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex gap-2 mb-4 border-b pb-4">
            <button
              className={`px-4 py-2.5 rounded-lg font-medium ${
                step === 1 ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
              disabled={step > 1}
            >
              1. Upload/Enter
            </button>
            <button
              className={`px-4 py-2.5 rounded-lg font-medium ${
                step === 2 ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
              disabled={step !== 2}
            >
              2. Validate
            </button>
            <button
              className={`px-4 py-2.5 rounded-lg font-medium ${
                step === 3 ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
              disabled={step !== 3}
            >
              3. Review & Edit
            </button>
            <button
              className={`px-4 py-2.5 rounded-lg font-medium ${
                step === 4 ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
              disabled={step !== 4}
            >
              4. Import
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Paste product data (tab-separated):</p>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-y"
                  placeholder="name	slug	category	description	shortDescription	pricePerKg	stockKg	images	basePrice	pricingTemplate	stockQuantity	productType	variants	faqs	isFeatured	isTodayOffer	isVisible	productOverview	whyChoose	ingredients	benefits	storageInstructions	shelfLife	origin	shippingInfo	seoKeywords	nutritionalInfo"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-bulk"
                  disabled={validating}
                />
                <label htmlFor="file-upload-bulk" className="cursor-pointer w-full">
                  <div className="text-gray-400 mb-2 text-3xl">📁</div>
                  <p className="text-sm text-gray-500">Or upload Excel file (.xlsx)</p>
                </label>
              </div>

              {fileName && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">✓</span>
                    <span className="text-green-800 font-medium">{fileName}</span>
                  </div>
                  <button
                    onClick={() => { setFile(null); setFileName(''); setTextInput('') }}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                    disabled={validating}
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                onClick={handleValidate}
                disabled={validating || (!file && !textInput.trim())}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3.5 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 inline-block mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Validating...
                  </>
                ) : (
                  'Validate Products'
                )}
              </button>
            </div>
          )}

          {step === 2 && validationResult && (
            <div id="step2-panel" role="tabpanel" className="space-y-6" aria-labelledby="step2-panel">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-800">{validationResult.totalRows}</div>
                  <div className="text-sm text-blue-600">Total Rows</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-green-800">{validationResult.validRows}</div>
                  <div className="text-sm text-green-600">Valid Rows</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${validationResult.invalidRows > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className={`text-3xl sm:text-4xl font-bold ${validationResult.invalidRows > 0 ? 'text-red-800' : 'text-gray-600'}`}>{validationResult.invalidRows}</div>
                  <div className="text-sm text-gray-600">Invalid Rows</div>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">{validationResult.errors.length} Error(s)</span>
                    Validation Errors
                  </h3>
                  <table className="min-w-full divide-y divide-gray-200" role="table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Row</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Column</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validationResult.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">Row {err.row}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium bg-gray-50">{err.column}</td>
                          <td className="px-4 py-3 text-sm text-red-600 max-w-md break-words">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={reset}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={validating}
                >
                  Choose Different File
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={validatedRows.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review & Edit ({validatedRows.length} rows)
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div id="step3-panel" role="tabpanel" className="space-y-6" aria-labelledby="step3-panel">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="all">All ({validatedRows.length})</option>
                  <option value="errors">Errors ({validatedRows.filter(r => !r.isValid).length})</option>
                  <option value="duplicates">Duplicates ({validatedRows.filter(r => r.isDuplicate).length})</option>
                  <option value="new">New ({validatedRows.filter(r => r.status === 'new').length})</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredRows.map((row) => (
                  <div key={row.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleProduct(row.id)}
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{row.name || 'Unnamed Product'}</h3>
                        {row.isDuplicate && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Duplicate
                          </span>
                        )}
                        {!row.isValid && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Invalid
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm">{row.category}</span>
                    </div>
                    
                    {openProducts.has(row.id) && (
                      <div className="p-4 border-t border-gray-200">
                        <ProductForm 
                          row={row}
                          categories={categories}
                          pricingTemplates={pricingTemplates}
                          allVariants={allVariants}
                          onUploadImage={(index, file) => handleImageUpload(row.id, index, file)}
                          getPricingPreview={() => getPricingPreview(row.id)}
                          onValidate={() => revalidateRow(row.id)}
                          onUpdate={(updatedRow) => {
                            const newRows = [...validatedRows]
                            const idx = parseInt(row.id.split('-')[1])
                            newRows[idx] = updatedRow
                            setValidatedRows(newRows)
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50"
                >
                  Back to Validation
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || filteredRows.some(r => !r.isValid)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 inline-block mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Importing...
                    </>
                  ) : (
                    `Import Products (${filteredRows.filter(r => r.isValid).length})`
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && importResult && (
            <div id="step4-panel" role="tabpanel" className="space-y-6" aria-labelledby="step4-panel">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-green-800">{importResult.imported}</div>
                  <div className="text-sm text-green-600">Imported</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${importResult.failed > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className={`text-3xl sm:text-4xl font-bold ${importResult.failed > 0 ? 'text-red-800' : 'text-gray-600'}`}>{importResult.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-800">{importResult.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">{importResult.errors.length} Error(s)</span>
                    Import Errors
                  </h3>
                  <table className="min-w-full divide-y divide-gray-200" role="table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Row</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importResult.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">Row {err.row}</td>
                          <td className="px-4 py-3 text-sm text-red-600 max-w-md break-words">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={reset}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2.5 rounded-xl font-semibold"
                >
                  Upload Another File
                </button>
                <a
                  href="/admin/products"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-center"
                >
                  View Products
                </a>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes slide-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-down { animation: slide-down 0.3s ease-out; }
          .animate-fade-in { animation: fade-in 0.3s ease-out; }
        `}</style>
      </div>
    </div>
  )
}