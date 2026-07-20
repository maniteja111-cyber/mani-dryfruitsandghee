'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  useEffect(() => {
    router.replace(`/admin/products/${id}/edit`)
  }, [id, router])

  return (
    <div className="p-6">
      <div className="animate-pulse bg-gray-200 h-10 rounded mb-4"></div>
    </div>
  )
}