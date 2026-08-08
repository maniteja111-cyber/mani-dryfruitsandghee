'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CloudinaryImage {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
  createdAt: string
}

export default function AdminMediaPage() {
  const [images, setImages] = useState<CloudinaryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [customFilenames, setCustomFilenames] = useState('')
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set())
  const [isBulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  const fetchImages = async (cursor?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/admin/cloudinary/images', window.location.origin)
      if (cursor) {
        url.searchParams.set('next_cursor', cursor)
      }

      const res = await fetch(url.toString())
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch images')
      }

      setImages(prev => cursor ? [...prev, ...data.images] : data.images)
      setNextCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (err: any) {
      setError(err.message || 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      Array.from(selectedFiles).forEach(file => {
        formData.append('images', file)
      })

      const names = customFilenames
        .split('\n')
        .map(n => n.trim())
        .filter(Boolean)
      if (names.length > 0) {
        formData.append('filenames', JSON.stringify(names))
      }

      const res = await fetch('/api/admin/cloudinary/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      alert(`Successfully uploaded ${data.count} image(s)`)
      setSelectedFiles(null)
      setCustomFilenames('')
      fetchImages()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (publicId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const res = await fetch(`/api/admin/cloudinary/images/${encodeURIComponent(publicId)}`, {
        method: 'DELETE'
      })

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await res.json() : null

      if (!res.ok) {
        throw new Error(data?.error || `Delete failed (${res.status})`)
      }

      setImages(prev => prev.filter(img => img.publicId !== publicId))
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedImageIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedImageIds.size} selected image(s)? This action cannot be undone.`)) return

    setBulkDeleteLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/cloudinary/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: Array.from(selectedImageIds) })
      })

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await res.json() : null

      if (!res.ok) {
        throw new Error(data?.error || `Bulk delete failed (${res.status})`)
      }

      setImages(prev => prev.filter(img => !selectedImageIds.has(img.publicId)))
      setSelectedImageIds(new Set())
      alert(data.message || 'Selected images deleted successfully')
    } catch (err: any) {
      setError(err.message || 'Bulk delete failed')
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  const toggleImageSelection = (publicId: string) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev)
      if (next.has(publicId)) {
        next.delete(publicId)
      } else {
        next.add(publicId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedImageIds.size === images.length) {
      setSelectedImageIds(new Set())
    } else {
      setSelectedImageIds(new Set(images.map(img => img.publicId)))
    }
  }

  const handleRename = async (publicId: string) => {
    if (!newName.trim()) return

    try {
      const res = await fetch(`/api/admin/cloudinary/images/${encodeURIComponent(publicId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPublicId: newName.trim() })
      })

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await res.json() : null

      if (!res.ok) {
        throw new Error(data?.error || `Rename failed (${res.status})`)
      }

      setImages(prev => prev.map(img => 
        img.publicId === publicId 
          ? { ...img, publicId: data.publicId, url: data.secureUrl }
          : img
      ))
      setRenamingId(null)
      setNewName('')
    } catch (err: any) {
      setError(err.message || 'Rename failed')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <Link
          href="/admin/products"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Products
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Images</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select images to upload to Cloudinary
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom filenames (optional, one per line)
            </label>
            <textarea
              value={customFilenames}
              onChange={(e) => setCustomFilenames(e.target.value)}
              placeholder={`premium-almonds\ncashew-250g\nhoney-bottle`}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to use auto-generated names. Names will be made SEO-friendly automatically.
            </p>
          </div>
          <button
            type="submit"
            disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            All Images ({images.length})
          </h2>
          <div className="flex items-center gap-3">
            {selectedImageIds.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedImageIds.size} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleteLoading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkDeleteLoading ? 'Deleting...' : `Delete Selected (${selectedImageIds.size})`}
                </button>
                <button
                  onClick={() => setSelectedImageIds(new Set())}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>
        </div>

        {loading && images.length === 0 && (
          <div className="text-center py-12 text-gray-500">Loading images...</div>
        )}

        {!loading && images.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            No images found in Cloudinary.
          </div>
        )}

        {images.length > 0 && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectedImageIds.size === images.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="selectAll" className="text-sm text-gray-700 cursor-pointer">
                Select All
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => {
                const isSelected = selectedImageIds.has(image.publicId)
                return (
                  <div
                    key={image.publicId}
                    className={`border rounded-xl overflow-hidden group relative ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleImageSelection(image.publicId)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <img
                      src={image.url}
                      alt={image.publicId}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 truncate" title={image.publicId}>
                        {image.publicId.split('/').pop()}
                      </p>
                      <p className="text-xs text-gray-400">{formatFileSize(image.bytes)}</p>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {renamingId === image.publicId ? (
                        <div className="flex gap-1 p-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="px-2 py-1 text-xs border rounded"
                            placeholder="New name"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(image.publicId)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setRenamingId(null)
                              setNewName('')
                            }}
                            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setRenamingId(image.publicId)
                              setNewName(image.publicId.split('/').pop() || '')
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDelete(image.publicId)}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => fetchImages(nextCursor || undefined)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
