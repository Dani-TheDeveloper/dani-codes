import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Property } from '../types'
import { Plus, Search, Building2, MapPin, Bed, Bath, X } from 'lucide-react'

const statusColors: Record<string, string> = {
  available: 'badge-green',
  occupied: 'badge-blue',
  maintenance: 'badge-yellow',
}

export default function Properties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zip_code: '', property_type: 'apartment', bedrooms: 0, bathrooms: 1, square_feet: 0, rent_amount: 0, description: '', amenities: '' })

  const fetchProperties = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/properties/?${params}`).then(r => setProperties(r.data))
  }

  useEffect(() => { fetchProperties() }, [search, statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/properties/', form)
    setShowModal(false)
    setForm({ name: '', address: '', city: '', state: '', zip_code: '', property_type: 'apartment', bedrooms: 0, bathrooms: 1, square_feet: 0, rent_amount: 0, description: '', amenities: '' })
    fetchProperties()
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 mt-1">{properties.length} properties total</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Property
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {properties.map(prop => (
          <div key={prop.id} className="card overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-blue-400" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{prop.name}</h3>
                <span className={statusColors[prop.status]}>{prop.status}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {prop.address}, {prop.city}, {prop.state}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {prop.bedrooms} bed</span>
                <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {prop.bathrooms} bath</span>
                {prop.square_feet && <span>{prop.square_feet} sqft</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-lg font-bold text-gray-900">${prop.rent_amount.toLocaleString()}</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No properties found</p>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Add Property</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="label">Property Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="label">Address</label><input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">City</label><input className="input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required /></div>
                <div><label className="label">State</label><input className="input" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required /></div>
                <div><label className="label">ZIP</label><input className="input" value={form.zip_code} onChange={e => setForm({...form, zip_code: e.target.value})} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})}>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>
                <div><label className="label">Rent ($/mo)</label><input type="number" className="input" value={form.rent_amount} onChange={e => setForm({...form, rent_amount: +e.target.value})} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Bedrooms</label><input type="number" className="input" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: +e.target.value})} /></div>
                <div><label className="label">Bathrooms</label><input type="number" step="0.5" className="input" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: +e.target.value})} /></div>
                <div><label className="label">Sq Ft</label><input type="number" className="input" value={form.square_feet} onChange={e => setForm({...form, square_feet: +e.target.value})} /></div>
              </div>
              <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Property</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
