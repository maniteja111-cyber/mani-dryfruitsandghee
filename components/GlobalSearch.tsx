'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

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

const MOCK_RESULTS: SearchResult[] = [
  { id: '1', name: 'Premium Badam', slug: 'premium-badam', category: 'Dry Fruits', priceDisplay: '₹600/kg', image: 'https://picsum.photos/seed/premium-almonds/400/400' },
  { id: '2', name: 'Tasty Cashews', slug: 'cashew-pieces', category: 'Dry Fruits', priceDisplay: '₹550/kg', image: 'https://picsum.photos/seed/cashew-pieces/400/400' },
  { id: '3', name: 'Pure Desi Ghee', slug: 'pure-desi-ghee', category: 'Ghee', priceDisplay: '₹350/pieces', image: 'https://picsum.photos/seed/pure-ghee-1l/400/400' },
  { id: '4', name: 'Spicy Mango Pickle', slug: 'spicy-mango-pickle', category: 'Pickles', priceDisplay: '₹120/packs', image: 'https://picsum.photos/seed/mango-pickle/400/400' },
  { id: '5', name: 'Organic Honey', slug: 'organic-honey', category: 'Pickles & Candies', priceDisplay: '₹250/litres', image: 'https://picsum.photos/seed/organic-honey/400/400' },
  { id: '6', name: 'Juicy Raisins', slug: 'juicy-raisins', category: 'Dry Fruits', priceDisplay: '₹180/kg', image: 'https://picsum.photos/seed/raisins-pack/400/400' },
  { id: '7', name: 'Crunchy Peanuts', slug: 'crunchy-peanuts', category: 'Dry Fruits', priceDisplay: '₹120/kg', image: 'https://picsum.photos/seed/crunchy-peanuts/400/400' },
  { id: '8', name: 'Premium Dates', slug: 'premium-dates', category: 'Dry Fruits', priceDisplay: '₹200/pieces', image: 'https://picsum.photos/seed/premium-dates/400/400' },
  { id: '9', name: 'Healthy Walnuts', slug: 'healthy-walnuts', category: 'Dry Fruits', priceDisplay: '₹700/kg', image: 'https://picsum.photos/seed/healthy-walnuts/400/400' },
  { id: '10', name: 'Virgin Coconut Oil', slug: 'virgin-coconut-oil', category: 'Ghee', priceDisplay: '₹180/litres', image: 'https://picsum.photos/seed/virgin-coconut-oil/400/400' },
]

function filterMockResults(query: string, maxResults: number): SearchResult[] {
  const term = query.trim().toLowerCase()
  if (!term) return []

  return MOCK_RESULTS
    .filter(r => r.name.toLowerCase().includes(term) || (r.category || '').toLowerCase().includes(term))
    .slice(0, maxResults)
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
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    setLoading(true)
    const timer = setTimeout(() => {
      const filtered = filterMockResults(query, maxResults)
      setResults(filtered)
      setIsOpen(filtered.length > 0)
      setActiveIndex(filtered.length > 0 ? 0 : -1)
      setLoading(false)
    }, debounceMs)

    return () => clearTimeout(timer)
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

      {isOpen && (
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

      {isOpen && !loading && results.length === 0 && query.trim().length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-4 text-sm text-gray-500">
          No products found. Press Enter to search all products.
        </div>
      )}
    </div>
  )
}
