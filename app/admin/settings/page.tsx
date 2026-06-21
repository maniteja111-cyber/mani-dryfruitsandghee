'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Setting {
  id: string
  key: string
  value: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discountPrice?: number | null
  images: any
  stock: number
}

function ProductSelector({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchProducts()
    parseValue(value)
  }, [value])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        setProducts(await res.json())
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const parseValue = (val: string) => {
    try {
      const ids = JSON.parse(val)
      setSelectedIds(Array.isArray(ids) ? ids : [])
    } catch {
      setSelectedIds([])
    }
  }

  const toggleProduct = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id]
    setSelectedIds(newIds)
    onChange(JSON.stringify(newIds))
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
      <p className="text-sm font-medium mb-2">{label} - Selected: {selectedIds.length}</p>
      <div className="space-y-1">
        {products.map(p => (
          <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedIds.includes(p.id)}
              onChange={() => toggleProduct(p.id)}
              className="rounded"
            />
            <span>{p.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchSettings()
  }, [])

  const checkAuth = () => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/login')
      return
    }
    const userData = JSON.parse(user)
    if (userData.phone !== '9999999999') {
      router.push('/')
      return
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        const defaultSettings: Record<string, string> = {
          aboutUsContent: `MANI DRY FRUITS & GHEE STORES is a premium retailer specializing in organic dry fruits, 
artisanal pickles, and pure ghee. Established with a commitment to quality and 
authenticity, we source our products directly from trusted farmers.

Our Mission
To provide customers with the highest quality natural foods that promote health 
and wellness, while supporting sustainable farming practices.

Why Choose Us
• 100% Organic and Natural Products
• Direct from Farm to Table
• No Preservatives or Artificial Additives
• Fast and Safe Delivery Across India
• Hassle-free Returns and Exchanges`,
          shippingPolicyContent: `We deliver premium dry fruits, pickles, and ghee across India with care and hygiene.

Shipping Areas: We ship to all major cities and towns across India.

Delivery Time: Typically 2-5 business days depending on location.

Shipping Charges: Free shipping on orders above ₹999. Standard shipping charge of ₹50 applies for orders below ₹999.

Packaging: All products are carefully packed in hygienic, tamper-proof packaging.

Order Tracking: You will receive a tracking number via SMS and email once your order is dispatched.`,
          refundPolicyContent: `We want you to be completely satisfied with your purchase. If you are not satisfied for any reason, we offer a 30-day money-back guarantee.

Eligibility for Refund:
• Products must be unused and in original packaging
• Request must be made within 30 days of delivery
• Products should not be expired or damaged

How to Request a Refund: Contact us at +91 9515019393 with your order details.

Refund Processing: Refunds will be processed within 5-7 business days.

Return Shipping: We will provide a prepaid return shipping label for eligible returns.`,
          privacyPolicyContent: `Last updated: June 2024

Information We Collect: We collect information you provide directly to us, including name, phone number, email, address, and order details.

How We Use Your Information:
• Process and fulfill your orders
• Send you order confirmations and updates
• Provide customer support
• Improve our products and services

Data Security: We take reasonable measures to protect your personal information.

Contact Us: If you have questions, please contact us at +91 9515019393.`,
          termsAndConditionsContent: `Last updated: June 2024

Acceptance of Terms: By accessing or using our website, you agree to be bound by these Terms and Conditions.

Product Information: We strive to provide accurate product information.

Orders: All orders are subject to our acceptance.

Payment: All payments are processed securely.

Limitation of Liability: Our liability is limited to the purchase price of the product.

Governing Law: These terms are governed by the laws of India.`
        }
        const mergedData = [...data]
        for (const key of Object.keys(defaultSettings)) {
          if (!data.find((s: any) => s.key === key)) {
            mergedData.push({ id: `new-${key}`, key, value: defaultSettings[key] })
          }
        }
        setSettings(mergedData)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      if (res.ok) {
        fetchSettings()
      }
    } catch (error) {
      console.error('Error updating setting:', error)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => prev.map(setting =>
      setting.key === key ? { ...setting, value } : setting
    ))
  }

  const handleSave = (key: string, value: string) => {
    updateSetting(key, value)
  }

  const handleFileUpload = async (key: string, file: File) => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        await updateSetting(key, data.url)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Website Settings</h1>
          <p className="text-gray-600 mt-1">Manage your store details, theme, logo and contact information.</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Settings</h2>
<ul className="text-sm text-blue-700 space-y-1">
                <li><strong>siteName:</strong> Main website title</li>
                <li><strong>logo:</strong> Full URL to logo image</li>
                <li><strong>themeColor:</strong> Hex color code (e.g., #ffd862)</li>
                <li><strong>whatsappNumber:</strong> Business WhatsApp number (with country code)</li>
                <li><strong>phone/email/address:</strong> Contact information</li>
                <li><strong>banners:</strong> JSON array of banner objects with image, title, description</li>
                <li><strong>heroTitle/heroSubtitle:</strong> Hero section titles</li>
                <li><strong>aboutUsContent:</strong> About Us page content (multiline text)</li>
                <li><strong>shippingPolicyContent:</strong> Shipping Policy page content</li>
                <li><strong>refundPolicyContent:</strong> Refund Policy page content</li>
                <li><strong>privacyPolicyContent:</strong> Privacy Policy page content</li>
                <li><strong>termsAndConditionsContent:</strong> Terms & Conditions page content</li>
                <li><strong>seoTitle/seoDescription:</strong> Homepage SEO metadata</li>
              </ul>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Edit Settings</h2>
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="flex flex-col gap-1 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-900">{setting.key}</label>
                    <span className="text-xs text-gray-400">{setting.key === 'logo' || setting.key === 'themeColor' ? 'saved instantly' : 'auto-saved on blur'}</span>
                  </div>

{setting.key === 'aboutUsContent' ? (
                    <textarea
                      value={setting.value}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      onBlur={(e) => handleSave(setting.key, e.target.value)}
                      placeholder="Enter about us content..."
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  ) : setting.key === 'heroSubtitle' ? (
                    <textarea
                      value={setting.value}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      onBlur={(e) => handleSave(setting.key, e.target.value)}
                      placeholder="Enter hero subtitle..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  ) : setting.key === 'logo' ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <input
                        type="text"
                        value={setting.value}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        onBlur={(e) => handleSave(setting.key, e.target.value)}
                        placeholder="https://.../logo.png or upload below"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      {setting.value && (
                        <img src={setting.value.startsWith('/') ? setting.value : `/uploads/${setting.value}`} alt="Current logo" className="h-12 mt-2 object-contain" />
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(setting.key, file)
                          }}
                          disabled={uploading}
                          className="text-sm"
                        />
                        {uploading && <span className="text-xs text-gray-500 ml-2">Uploading...</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paste a full image URL above or upload an image file.
                      </div>
                    </div>
                  ) : setting.key === 'themeColor' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={setting.value.startsWith('#') ? setting.value : '#ffd862'}
                        onChange={(e) => handleSave(setting.key, e.target.value)}
                        className="h-10 w-14 p-0 border-0 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={setting.value}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        onBlur={(e) => handleSave(setting.key, e.target.value)}
                        placeholder="#ffd862"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                      />
                    </div>
                  ) : setting.key === 'banners' || setting.key === 'shippingPolicyContent' || setting.key === 'refundPolicyContent' || setting.key === 'privacyPolicyContent' || setting.key === 'termsAndConditionsContent' ? (
                    <textarea
                      value={setting.value}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      onBlur={(e) => handleSave(setting.key, e.target.value)}
                      placeholder={`Enter ${setting.key === 'banners' ? 'JSON array' : setting.key.replace(/Content/g, '')} content...`}
                      rows={setting.key === 'banners' ? 4 : 8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      onBlur={(e) => handleSave(setting.key, e.target.value)}
                      placeholder={setting.key === 'whatsappNumber' ? '+919876543210' : `Enter ${setting.key}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}