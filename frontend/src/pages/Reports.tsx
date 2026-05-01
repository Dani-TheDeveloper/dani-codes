import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { FinancialReport, OccupancyReport } from '../types'
import { BarChart3, PieChart, TrendingUp, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPie, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Reports() {
  const [financial, setFinancial] = useState<FinancialReport | null>(null)
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null)
  const [tab, setTab] = useState<'financial' | 'occupancy'>('financial')

  useEffect(() => {
    api.get('/reports/financial').then(r => setFinancial(r.data)).catch(() => {})
    api.get('/reports/occupancy').then(r => setOccupancy(r.data)).catch(() => {})
  }, [])

  const monthlyData = financial?.monthly_revenue.map(m => ({ name: MONTHS[m.month - 1], revenue: m.revenue })) || []
  const occupancyData = occupancy ? [
    { name: 'Occupied', value: occupancy.occupied },
    { name: 'Available', value: occupancy.available },
    { name: 'Maintenance', value: occupancy.maintenance },
  ].filter(d => d.value > 0) : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Financial and operational insights</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setTab('financial')} className={`btn ${tab === 'financial' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          <DollarSign className="w-4 h-4" /> Financial
        </button>
        <button onClick={() => setTab('occupancy')} className={`btn ${tab === 'occupancy' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          <PieChart className="w-4 h-4" /> Occupancy
        </button>
      </div>

      {tab === 'financial' && financial && (
        <div>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-5">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">${financial.total_revenue.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">${financial.total_pending.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">${financial.total_overdue.toLocaleString()}</p>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          {Object.keys(financial.payment_breakdown).length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(financial.payment_breakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                    <span className="text-sm font-semibold text-gray-900">${amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'occupancy' && occupancy && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="card p-5">
              <p className="text-sm text-gray-500">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{occupancy.total_properties}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">Occupied</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{occupancy.occupied}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">Occupancy Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{occupancy.occupancy_rate}%</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500">Vacancy Rate</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{occupancy.vacancy_rate}%</p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Status Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RPie>
                  <Pie data={occupancyData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {occupancyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RPie>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
