import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { CalendarEvent } from '../types'
import { Calendar, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

const typeColors: Record<string, string> = {
  showing: 'bg-blue-100 text-blue-700 border-blue-200',
  maintenance: 'bg-orange-100 text-orange-700 border-orange-200',
  meeting: 'bg-purple-100 text-purple-700 border-purple-200',
  inspection: 'bg-green-100 text-green-700 border-green-200',
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [form, setForm] = useState({ title: '', description: '', event_type: 'showing', start_time: '', end_time: '', property_id: 0 })
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    api.get(`/calendar/?start=${start.toISOString()}&end=${end.toISOString()}`).then(r => setEvents(r.data))
  }, [currentMonth])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDay = startOfMonth(currentMonth).getDay()

  const openCreate = () => {
    api.get('/properties/').then(r => setProperties(r.data))
    setShowCreate(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/calendar/', { ...form, property_id: form.property_id || undefined })
    setShowCreate(false)
    setForm({ title: '', description: '', event_type: 'showing', start_time: '', end_time: '', property_id: 0 })
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    api.get(`/calendar/?start=${start.toISOString()}&end=${end.toISOString()}`).then(r => setEvents(r.data))
  }

  const dayEvents = (day: Date) => events.filter(e => isSameDay(new Date(e.start_time), day))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">Property showings & maintenance schedules</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Event</button>
      </div>

      <div className="card">
        {/* Month nav */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 uppercase py-3">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="min-h-24 border-b border-r border-gray-100" />)}
          {days.map(day => {
            const evts = dayEvents(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 p-1.5 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <span className={`text-xs font-medium ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  {evts.slice(0, 2).map(evt => (
                    <div key={evt.id} className={`text-xs px-1.5 py-0.5 rounded border truncate ${typeColors[evt.event_type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {evt.title}
                    </div>
                  ))}
                  {evts.length > 2 && <div className="text-xs text-gray-400 px-1">+{evts.length - 2} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected date events */}
      {selectedDate && dayEvents(selectedDate).length > 0 && (
        <div className="card mt-4 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Events on {format(selectedDate, 'MMMM d, yyyy')}</h3>
          <div className="space-y-3">
            {dayEvents(selectedDate).map(evt => (
              <div key={evt.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${evt.event_type === 'showing' ? 'bg-blue-500' : evt.event_type === 'maintenance' ? 'bg-orange-500' : 'bg-purple-500'}`} />
                <div>
                  <p className="font-medium text-gray-900">{evt.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {format(new Date(evt.start_time), 'h:mm a')}
                    {evt.end_time && ` — ${format(new Date(evt.end_time), 'h:mm a')}`}
                  </p>
                  {evt.description && <p className="text-sm text-gray-600 mt-1">{evt.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Add Calendar Event</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div>
                <label className="label">Event Type</label>
                <select className="input" value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}>
                  <option value="showing">Property Showing</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="meeting">Meeting</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div>
                <label className="label">Property (optional)</label>
                <select className="input" value={form.property_id} onChange={e => setForm({...form, property_id: +e.target.value})}>
                  <option value={0}>None</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start</label><input type="datetime-local" className="input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required /></div>
                <div><label className="label">End</label><input type="datetime-local" className="input" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} /></div>
              </div>
              <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
