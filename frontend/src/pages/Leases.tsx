import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Lease } from '../types'
import { FileText, Plus, X, RefreshCw } from 'lucide-react'

const statusColors: Record<string, string> = {
  active: 'badge-green',
  expired: 'badge-red',
  terminated: 'badge-gray',
  pending_renewal: 'badge-yellow',
}

export default function Leases() {
  const { user } = useAuth()
  const [leases, setLeases] = useState<Lease[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ property_id: 0, tenant_id: 0, start_date: '', end_date: '', rent_amount: 0, security_deposit: 0, terms: '' })
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])

  const fetchLeases = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/leases/?${params}`).then(r => setLeases(r.data))
  }

  useEffect(() => { fetchLeases() }, [statusFilter])

  const openCreate = () => {
    api.get('/properties/?status=available').then(r => setProperties(r.data))
    api.get('/users/?role=tenant').then(r => setTenants(r.data))
    setShowCreate(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/leases/', form)
    setShowCreate(false)
    fetchLeases()
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-500 mt-1">{leases.length} leases total</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending_renewal">Pending Renewal</option>
          </select>
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> New Lease
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Property</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Period</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Rent</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                {isAdmin && <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leases.map(lease => (
                <tr key={lease.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{lease.property?.name || `Property #${lease.property_id}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lease.tenant?.full_name || `Tenant #${lease.tenant_id}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(lease.start_date).toLocaleDateString()} — {new Date(lease.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${lease.rent_amount.toLocaleString()}/mo</td>
                  <td className="px-6 py-4"><span className={statusColors[lease.status]}>{lease.status.replace('_', ' ')}</span></td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {lease.status === 'pending_renewal' && (
                        <button
                          onClick={async () => {
                            const newEnd = new Date(lease.end_date)
                            newEnd.setFullYear(newEnd.getFullYear() + 1)
                            await api.post(`/leases/${lease.id}/renew?new_end_date=${newEnd.toISOString().split('T')[0]}`)
                            fetchLeases()
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Renew
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {leases.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No leases found</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Create Lease</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Property</label>
                <select className="input" value={form.property_id} onChange={e => setForm({...form, property_id: +e.target.value})} required>
                  <option value={0}>Select property</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tenant</label>
                <select className="input" value={form.tenant_id} onChange={e => setForm({...form, tenant_id: +e.target.value})} required>
                  <option value={0}>Select tenant</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start Date</label><input type="date" className="input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required /></div>
                <div><label className="label">End Date</label><input type="date" className="input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Rent ($/mo)</label><input type="number" className="input" value={form.rent_amount} onChange={e => setForm({...form, rent_amount: +e.target.value})} required /></div>
                <div><label className="label">Security Deposit</label><input type="number" className="input" value={form.security_deposit} onChange={e => setForm({...form, security_deposit: +e.target.value})} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Lease</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
