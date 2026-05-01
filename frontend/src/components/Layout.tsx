import React, { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import {
  Home, Building2, Users, FileText, CreditCard, Wrench,
  Bell, MessageSquare, Calendar, BarChart3, FolderOpen,
  LogOut, Menu, X, Search, ChevronDown
} from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', roles: ['admin', 'manager', 'tenant'] },
  { to: '/properties', icon: Building2, label: 'Properties', roles: ['admin', 'manager', 'tenant'] },
  { to: '/tenants', icon: Users, label: 'Tenants', roles: ['admin', 'manager'] },
  { to: '/leases', icon: FileText, label: 'Leases', roles: ['admin', 'manager', 'tenant'] },
  { to: '/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'manager', 'tenant'] },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', roles: ['admin', 'manager', 'tenant'] },
  { to: '/calendar', icon: Calendar, label: 'Calendar', roles: ['admin', 'manager'] },
  { to: '/messages', icon: MessageSquare, label: 'Messages', roles: ['admin', 'manager', 'tenant'] },
  { to: '/documents', icon: FolderOpen, label: 'Documents', roles: ['admin', 'manager', 'tenant'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [globalSearch, setGlobalSearch] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    api.get('/notifications/?unread_only=true&limit=10').then(r => {
      setNotifications(r.data)
      setUnreadNotifs(r.data.length)
    }).catch(() => {})
  }, [location.pathname])

  const filteredNav = navItems.filter(n => user && n.roles.includes(user.role))

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    setNotifications([])
    setUnreadNotifs(0)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">PropertyHub</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {filteredNav.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6 shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties, tenants..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="input pl-9 py-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadNotifs > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">No new notifications</p>
                    ) : notifications.map((n: any) => (
                      <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 ${n.is_urgent ? 'bg-red-50' : ''}`}>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                  <Link to="/notifications" className="block p-3 text-center text-sm text-blue-600 hover:text-blue-700 border-t border-gray-100" onClick={() => setShowNotifs(false)}>
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.full_name?.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Profile Settings</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
