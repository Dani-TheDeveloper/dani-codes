import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Document } from '../types'
import { FolderOpen, Upload, Trash2, Search, FileText, File } from 'lucide-react'

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [uploading, setUploading] = useState(false)

  const fetchDocs = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    api.get(`/documents/?${params}`).then(r => setDocuments(r.data))
  }

  useEffect(() => { fetchDocs() }, [search, category])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'general')
    try {
      await api.post('/documents/', formData)
      fetchDocs()
    } finally {
      setUploading(false)
    }
  }

  const deleteDoc = async (id: number) => {
    if (!confirm('Delete this document?')) return
    await api.delete(`/documents/${id}`)
    fetchDocs()
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Manage leases, contracts, and property files</p>
        </div>
        <label className={`btn-primary cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="lease">Leases</option>
          <option value="contract">Contracts</option>
          <option value="invoice">Invoices</option>
          <option value="general">General</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Size</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Category</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Uploaded</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.file_type || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatSize(doc.file_size)}</td>
                  <td className="px-6 py-4"><span className="badge-blue">{doc.category || 'general'}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteDoc(doc.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {documents.length === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No documents uploaded</p>
        </div>
      )}
    </div>
  )
}
