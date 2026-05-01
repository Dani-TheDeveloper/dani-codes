import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Message, User } from '../types'
import { MessageSquare, Send, Plus, X, Inbox, ArrowUpRight } from 'lucide-react'

export default function Messages() {
  const { user: currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [folder, setFolder] = useState('inbox')
  const [selected, setSelected] = useState<Message | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ recipient_id: 0, subject: '', body: '' })

  useEffect(() => {
    api.get(`/messages/?folder=${folder}`).then(r => setMessages(r.data))
  }, [folder])

  const openCompose = () => {
    api.get('/users/').then(r => setUsers(r.data)).catch(() => {})
    setShowCompose(true)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/messages/', form)
    setShowCompose(false)
    setForm({ recipient_id: 0, subject: '', body: '' })
    api.get(`/messages/?folder=${folder}`).then(r => setMessages(r.data))
  }

  const viewMessage = async (msg: Message) => {
    setSelected(msg)
    if (!msg.is_read && folder === 'inbox') {
      await api.put(`/messages/${msg.id}/read`)
      setMessages(messages.map(m => m.id === msg.id ? { ...m, is_read: true } : m))
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Tenant communication portal</p>
        </div>
        <button onClick={openCompose} className="btn-primary"><Plus className="w-4 h-4" /> Compose</button>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={() => setFolder('inbox')} className={`btn ${folder === 'inbox' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          <Inbox className="w-4 h-4" /> Inbox
        </button>
        <button onClick={() => setFolder('sent')} className={`btn ${folder === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          <ArrowUpRight className="w-4 h-4" /> Sent
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="lg:col-span-1 card overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {messages.map(msg => (
              <button
                key={msg.id}
                onClick={() => viewMessage(msg)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? 'bg-blue-50' : ''} ${!msg.is_read && folder === 'inbox' ? 'bg-blue-25' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${!msg.is_read && folder === 'inbox' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {folder === 'inbox' ? `From #${msg.sender_id}` : `To #${msg.recipient_id}`}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{msg.subject}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{msg.body}</p>
              </button>
            ))}
            {messages.length === 0 && (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No messages</p>
              </div>
            )}
          </div>
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2 card p-6">
          {selected ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{selected.subject}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <span>From: User #{selected.sender_id}</span>
                <span>To: User #{selected.recipient_id}</span>
                <span>{new Date(selected.created_at).toLocaleString()}</span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{selected.body}</div>
              <button
                onClick={() => {
                  setForm({ recipient_id: selected.sender_id, subject: `Re: ${selected.subject}`, body: '' })
                  setShowCompose(true)
                }}
                className="btn-primary mt-6"
              >
                <Send className="w-4 h-4" /> Reply
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p>Select a message to read</p>
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Compose Message</h2>
              <button onClick={() => setShowCompose(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className="label">To</label>
                <select className="input" value={form.recipient_id} onChange={e => setForm({...form, recipient_id: +e.target.value})} required>
                  <option value={0}>Select recipient</option>
                  {users.filter(u => u.id !== currentUser?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required /></div>
              <div><label className="label">Message</label><textarea className="input" rows={5} value={form.body} onChange={e => setForm({...form, body: e.target.value})} required /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCompose(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1"><Send className="w-4 h-4" /> Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
