import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Payment } from '../types'
import { CreditCard, DollarSign, CheckCircle2 } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  overdue: 'badge-red',
  partial: 'badge-blue',
}

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [processing, setProcessing] = useState<number | null>(null)

  const fetchPayments = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/payments/?${params}`).then(r => setPayments(r.data))
  }

  useEffect(() => { fetchPayments() }, [statusFilter])

  const processPayment = async (paymentId: number) => {
    setProcessing(paymentId)
    try {
      await api.post(`/payments/${paymentId}/process`, {
        payment_method: 'credit_card',
      })
      fetchPayments()
    } finally {
      setProcessing(null)
    }
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">{payments.length} payment records</p>
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-lg font-bold text-gray-900">${totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-lg font-bold text-gray-900">${totalPending.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-lg font-bold text-gray-900">${totalOverdue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">ID</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Due Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Paid Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Method</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">#{p.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.payment_method || '—'}</td>
                  <td className="px-6 py-4"><span className={statusColors[p.status]}>{p.status}</span></td>
                  <td className="px-6 py-4">
                    {(p.status === 'pending' || p.status === 'overdue') && (
                      <button
                        onClick={() => processPayment(p.id)}
                        disabled={processing === p.id}
                        className="btn-success text-xs py-1.5 px-3"
                      >
                        {processing === p.id ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}
                    {p.status === 'paid' && p.transaction_id && (
                      <span className="text-xs text-gray-400">{p.transaction_id}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payments.length === 0 && (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payments found</p>
        </div>
      )}
    </div>
  )
}
