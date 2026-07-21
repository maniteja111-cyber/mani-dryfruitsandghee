'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface SearchResult {
  id: string
  name: string
  slug: string
  category?: string
  priceDisplay?: string
  image?: string
}

export interface GlobalSearchProps {
  onNavigate?: (url: string) => void
  placeholder?: string
  maxResults?: number
  debounceMs?: number
}

export default function GlobalSearch({
  onNavigate,
  placeholder = 'Search products...',
  maxResults = 8,
  debounceMs = 250,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastQueryRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsOpen(false)
      setActiveIndex(-1)
      setError(null)
      return
    }

    if (trimmed === lastQueryRef.current) {
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    lastQueryRef.current = trimmed

    setLoading(true)
    setError(null)

    const timer = setTimeout(async () => {
      try {
        const url = new URL('/api/products', window.location.origin)
        url.searchParams.set('search', trimmed)
        url.searchParams.set('limit', String(maxResults))

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`)
        }

        const data = (await response.json()) as SearchResult[]
        const mapped = (Array.isArray(data) ? data : []).map((item: any) => {
          const categoryName = item.category && typeof item.category === 'object' && 'name' in item.category ? item.category.name : undefined
          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            category: categoryName,
            priceDisplay: item.priceDisplay,
            image: Array.isArray(item.images) ? item.images[0] : undefined,
          }
        })

        setResults(mapped)
        setIsOpen(mapped.length > 0)
        setActiveIndex(mapped.length > 0 ? 0 : -1)
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return
        console.error('Global search error:', err)
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
        setIsOpen(false)
        setActiveIndex(-1)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      controller.abort()
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [query, maxResults, debounceMs])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [close])

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return
    const activeItem = listRef.current.children[activeIndex] as HTMLElement | undefined
    activeItem?.scrollIntoView({ block: 'nearest' })
  }, [isOpen, activeIndex])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true)
        setActiveIndex(0)
        event.preventDefault()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case 'Enter':
        event.preventDefault()
        if (activeIndex >= 0 && activeIndex < results.length) {
          const selected = results[activeIndex]
          onNavigate?.(`/products/${selected.slug}`)
          close()
        } else if (query.trim()) {
          onNavigate?.(`/products?search=${encodeURIComponent(query.trim())}`)
          close()
        }
        break
      case 'Escape':
        event.preventDefault()
        close()
        inputRef.current?.blur()
        break
      default:
        break
    }
  }

  const handleResultClick = (slug: string) => {
    onNavigate?.(`/products/${slug}`)
    close()
  }

  const handleInputClick = () => {
    if (results.length > 0 && !isOpen) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && query.trim()) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
        {loading && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </span>
        )}
      </div>

      {isOpen && !error && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto"
        >
          {results.map((result, index) => (
            <li
              key={result.id}
              className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${
                index === activeIndex ? 'bg-yellow-50' : 'bg-white hover:bg-gray-50'
              }`}
              onMouseDown={() => handleResultClick(result.slug)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {result.image && (
                <img
                  src={result.image}
                  alt={result.name}
                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                {result.category && (
                  <p className="text-xs text-gray-500 truncate">{result.category}</p>
                )}
              </div>
              {result.priceDisplay && (
                <span className="ml-auto text-xs font-semibold text-gray-700">{result.priceDisplay}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && !loading && results.length === 0 && query.trim().length > 0 && !error && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-4 text-sm text-gray-500">
          No products found. Press Enter to search all products.
        </div>
      )}

      {error && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-red-200 rounded-lg shadow-lg px-3 py-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
