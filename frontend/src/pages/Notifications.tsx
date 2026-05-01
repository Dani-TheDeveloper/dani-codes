import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Notification } from '../types'
import { Bell, CheckCheck, AlertTriangle } from 'lucide-react'

const typeIcons: Record<string, string> = {
  rent_due: '💰',
  lease_expiring: '📋',
  maintenance_update: '🔧',
  payment_received: '✓',
  lease_renewal: '🔄',
  general: '📢',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifs = () => {
    const params = new URLSearchParams()
    if (filter === 'unread') params.set('unread_only', 'true')
    api.get(`/notifications/?${params}`).then(r => setNotifications(r.data))
  }

  useEffect(() => { fetchNotifs() }, [filter])

  const markRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`)
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">{notifications.filter(n => !n.is_read).length} unread</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setFilter('unread')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Unread</button>
          </div>
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead(n.id)}
            className={`card p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow ${!n.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''} ${n.is_urgent ? 'border-l-4 border-l-red-500' : ''}`}
          >
            <div className="text-xl shrink-0 mt-0.5">{typeIcons[n.notification_type] || '📢'}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</h3>
                {n.is_urgent && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications</p>
        </div>
      )}
    </div>
  )
}
