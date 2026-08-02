'use client'

import { useEffect, useState } from 'react'

interface Visit {
  id: string
  dateOnly: string
  visitorId: string
  visitorToken: string
  ip: string | null
  userAgent: string | null
  isBot: boolean
  deviceType: string | null
  browser: string | null
  os: string | null
  country: string | null
  referer: string | null
  path: string | null
  userPhone: string | null
  userName: string | null
}

interface VisitsResponse {
  todayHumanVisitors: number
  todayBotVisitors: number
  totalHumanVisitors: number
  totalBotVisitors: number
  visits: Visit[]
}

function getReferrerLabel(referer: string | null): string {
  if (!referer) return 'Direct'
  const lower = referer.toLowerCase()
  if (lower.includes('google')) return 'Google'
  if (lower.includes('facebook') || lower.includes('fb.com')) return 'Facebook'
  if (lower.includes('instagram')) return 'Instagram'
  if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter'
  if (lower.includes('linkedin')) return 'LinkedIn'
  return referer
}

export default function AdminVisitsPage() {
  const [data, setData] = useState<VisitsResponse>({ todayHumanVisitors: 0, todayBotVisitors: 0, totalHumanVisitors: 0, totalBotVisitors: 0, visits: [] })
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Human Visitors</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{data.totalHumanVisitors}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Bot Visitors</h3>
          <p className="text-3xl font-bold text-red-600 mt-1">{data.totalBotVisitors}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Today Human Visitors</h3>
          <p className="text-3xl font-bold text-green-600 mt-1">{data.todayHumanVisitors}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Today Bot Visitors</h3>
          <p className="text-3xl font-bold text-orange-600 mt-1">{data.todayBotVisitors}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h3 className="text-sm text-gray-500 mb-2">Filter by Date</h3>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-sm text-yellow-600 hover:underline"
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visitor Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Browser</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Landing Page</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visitor ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id}>
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{day}</td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        <span className={visit.isBot ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {visit.isBot ? '🔴 Bot' : '🟢 Human'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">{visit.ip || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{visit.deviceType || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{visit.browser || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{visit.os || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{getReferrerLabel(visit.referer)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{visit.path || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{visit.userName || visit.userPhone || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono break-all">{visit.visitorId}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 break-all" title={visit.userAgent || ''}>
                        {visit.userAgent ? visit.userAgent.slice(0, 40) + (visit.userAgent.length > 40 ? '...' : '') : '-'}
                      </td>
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
