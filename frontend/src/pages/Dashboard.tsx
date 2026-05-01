import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { DashboardKPIs } from '../types'
import {
  Building2, Users, DollarSign, AlertTriangle, FileText,
  Wrench, TrendingUp, Clock
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setKpis(r.data)).catch(() => {})
  }, [])

  if (!kpis) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const cards = [
    { label: 'Total Properties', value: kpis.total_properties, icon: Building2, color: 'blue', link: '/properties' },
    { label: 'Total Tenants', value: kpis.total_tenants, icon: Users, color: 'green', link: '/tenants' },
    { label: 'Total Revenue', value: `$${kpis.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'emerald', link: '/reports' },
    { label: 'Pending Payments', value: `$${kpis.pending_payments.toLocaleString()}`, icon: Clock, color: 'yellow', link: '/payments' },
    { label: 'Overdue Payments', value: `$${kpis.overdue_payments.toLocaleString()}`, icon: AlertTriangle, color: 'red', link: '/payments' },
    { label: 'Occupancy Rate', value: `${kpis.occupancy_rate}%`, icon: TrendingUp, color: 'purple', link: '/reports' },
    { label: 'Active Leases', value: kpis.active_leases, icon: FileText, color: 'indigo', link: '/leases' },
    { label: 'Open Maintenance', value: kpis.open_maintenance, icon: Wrench, color: 'orange', link: '/maintenance' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your properties today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <Link key={card.label} to={card.link} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {kpis.expiring_leases > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Lease Alerts</h3>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">{kpis.expiring_leases} lease(s) expiring soon</p>
                  <p className="text-sm text-yellow-600 mt-0.5">Within the next 30 days</p>
                </div>
              </div>
              <Link to="/leases" className="inline-block mt-3 text-sm font-medium text-yellow-700 hover:text-yellow-800">
                View expiring leases →
              </Link>
            </div>
          </div>
        )}

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {user?.role !== 'tenant' && (
              <>
                <Link to="/properties" className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center">
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">Add Property</span>
                </Link>
                <Link to="/tenants" className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">View Tenants</span>
                </Link>
              </>
            )}
            <Link to="/payments" className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
              <span className="text-xs font-medium text-gray-700">Payments</span>
            </Link>
            <Link to="/maintenance" className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center">
              <Wrench className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <span className="text-xs font-medium text-gray-700">Maintenance</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
