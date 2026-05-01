export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  role: 'admin' | 'manager' | 'tenant'
  is_active: boolean
  created_at: string
  avatar_url: string | null
}

export interface Property {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_feet: number | null
  rent_amount: number
  status: 'available' | 'occupied' | 'maintenance'
  description: string | null
  amenities: string | null
  image_url: string | null
  manager_id: number | null
  created_at: string
}

export interface Lease {
  id: number
  property_id: number
  tenant_id: number
  start_date: string
  end_date: string
  rent_amount: number
  security_deposit: number
  status: 'active' | 'expired' | 'terminated' | 'pending_renewal'
  terms: string | null
  created_at: string
  tenant?: User
  property?: Property
}

export interface Payment {
  id: number
  lease_id: number
  tenant_id: number
  amount: number
  payment_date: string | null
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  payment_method: string | null
  transaction_id: string | null
  notes: string | null
  created_at: string
}

export interface MaintenanceRequest {
  id: number
  property_id: number
  requested_by: number
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date: string | null
  completed_date: string | null
  cost: number | null
  notes: string | null
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  is_urgent: boolean
  created_at: string
}

export interface Message {
  id: number
  sender_id: number
  recipient_id: number
  subject: string
  body: string
  is_read: boolean
  parent_id: number | null
  created_at: string
}

export interface Document {
  id: number
  name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  property_id: number | null
  uploaded_by: number
  category: string | null
  description: string | null
  created_at: string
}

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  event_type: string
  property_id: number | null
  start_time: string
  end_time: string | null
  all_day: boolean
  created_by: number
  created_at: string
}

export interface DashboardKPIs {
  total_properties: number
  total_tenants: number
  total_revenue: number
  pending_payments: number
  overdue_payments: number
  occupancy_rate: number
  active_leases: number
  expiring_leases: number
  open_maintenance: number
  unread_notifications: number
}

export interface FinancialReport {
  total_revenue: number
  total_pending: number
  total_overdue: number
  monthly_revenue: { month: number; revenue: number }[]
  payment_breakdown: Record<string, number>
}

export interface OccupancyReport {
  total_properties: number
  occupied: number
  available: number
  maintenance: number
  occupancy_rate: number
  vacancy_rate: number
}
