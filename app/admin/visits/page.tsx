'use client'

import { useEffect, useState } from 'react'

interface Visit {
  id: string
  dateOnly: string
  visitorId: string
  ip: string | null
  userAgent: string | null
  userPhone: string | null
  userName: string | null
}

interface VisitsResponse {
  todayUnique: number
  totalUnique: number
  visits: Visit[]
}

export default function AdminVisitsPage() {
  const [data, setData] = useState<VisitsResponse>({ todayUnique: 0, totalUnique: 0, visits: [] })
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    fetch('/api/visits/unique')
      .then(res => res.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const grouped = data.visits.reduce<Record<string, Visit[]>>((acc, visit) => {
    const day = visit.dateOnly ? new Date(visit.dateOnly).toLocaleDateString() : 'Unknown'
    if (!acc[day]) acc[day] = []
    acc[day].push(visit)
    return acc
  }, {})

  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const visibleDays = selectedDate ? [selectedDate] : sortedDays

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Unique Visits</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Total Unique Visitors</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{data.totalUnique}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Today Unique Visitors</h3>
          <p className="text-3xl font-bold text-green-600 mt-1">{data.todayUnique}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Filter by Date</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="mt-2 text-sm text-yellow-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {visibleDays.map(day => {
        const visits = grouped[day] || []
        return (
          <div key={day} className="bg-white rounded-2xl shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">
                {day} — <span className="text-sm text-gray-500">{visits.length} unique visitor{visits.length !== 1 ? 's' : ''}</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visitor ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id}>
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{day}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">{visit.ip || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{visit.userName || visit.userPhone || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono break-all">{visit.visitorId}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 break-all">{visit.userAgent || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
