import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { User } from '../types'
import { Search, Users, Mail, Phone } from 'lucide-react'

export default function Tenants() {
  const [tenants, setTenants] = useState<User[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({ role: 'tenant' })
    if (search) params.set('search', search)
    api.get(`/users/?${params}`).then(r => setTenants(r.data))
  }, [search])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">{tenants.length} tenants found</p>
        </div>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search tenants by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tenants.map(t => (
          <div key={t.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
                {t.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{t.full_name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.email}</span>
                </div>
                {t.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {t.phone}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className={t.is_active ? 'badge-green' : 'badge-red'}>{t.is_active ? 'Active' : 'Inactive'}</span>
              <span className="text-xs text-gray-400">Since {new Date(t.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tenants found</p>
        </div>
      )}
    </div>
  )
}
