'use client'

import { useEffect, useState } from 'react'

interface CloudinaryImage {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
  createdAt: string
}

interface CloudinaryMediaPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  selectedUrl?: string
}

export default function CloudinaryMediaPicker({
  isOpen,
  onClose,
  onSelect,
  selectedUrl
}: CloudinaryMediaPickerProps) {
  const [images, setImages] = useState<CloudinaryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchImages()
    }
  }, [isOpen])

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

      if (cursor) {
        setImages(prev => [...prev, ...data.images])
      } else {
        setImages(data.images || [])
      }
      setNextCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (err: any) {
      setError(err.message || 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (image: CloudinaryImage) => {
    onSelect(image.url)
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Choose from Cloudinary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {loading && images.length === 0 && (
            <div className="text-center py-12 text-gray-500">Loading images...</div>
          )}

          {!loading && images.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              No images found in Cloudinary.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.publicId}
                onClick={() => handleSelect(image)}
                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                  selectedUrl === image.url
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.publicId}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 bg-gray-50">
                  <p className="text-xs text-gray-600 truncate">{image.publicId.split('/').pop()}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(image.bytes)}</p>
                </div>
                {selectedUrl === image.url && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
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
        </div>
      </div>
    </div>
  )
}
