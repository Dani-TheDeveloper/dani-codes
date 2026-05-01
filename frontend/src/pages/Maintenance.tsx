import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { MaintenanceRequest } from '../types'
import { Wrench, Plus, X } from 'lucide-react'

const statusColors: Record<string, string> = { open: 'badge-red', in_progress: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-gray' }
const priorityColors: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-yellow', urgent: 'badge-red' }

export default function Maintenance() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [form, setForm] = useState({ property_id: 0, title: '', description: '', priority: 'medium' })

  const fetch = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/maintenance/?${params}`).then(r => setRequests(r.data))
  }

  useEffect(() => { fetch() }, [statusFilter])

  const openCreate = () => {
    api.get('/properties/').then(r => setProperties(r.data))
    setShowCreate(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/maintenance/', form)
    setShowCreate(false)
    setForm({ property_id: 0, title: '', description: '', priority: 'medium' })
    fetch()
  }

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/maintenance/${id}`, { status })
    fetch()
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1">{requests.length} requests</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> New Request</button>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{req.title}</h3>
                  <span className={priorityColors[req.priority]}>{req.priority}</span>
                  <span className={statusColors[req.status]}>{req.status.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-gray-600">{req.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>Property #{req.property_id}</span>
                  <span>Created {new Date(req.created_at).toLocaleDateString()}</span>
                  {req.scheduled_date && <span>Scheduled: {new Date(req.scheduled_date).toLocaleDateString()}</span>}
                  {req.cost != null && <span>Cost: ${req.cost.toLocaleString()}</span>}
                </div>
              </div>
              {isAdmin && req.status !== 'completed' && req.status !== 'cancelled' && (
                <div className="flex gap-2 shrink-0">
                  {req.status === 'open' && (
                    <button onClick={() => updateStatus(req.id, 'in_progress')} className="btn-secondary text-xs py-1.5">Start</button>
                  )}
                  <button onClick={() => updateStatus(req.id, 'completed')} className="btn-success text-xs py-1.5">Complete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No maintenance requests</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">New Maintenance Request</h2>
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
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
