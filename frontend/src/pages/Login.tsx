import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName, phone: phone || undefined })
        setIsRegister(false)
        setError('')
        alert('Registration successful! Please sign in.')
      } else {
        await login(email, password)
        navigate('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">PropertyHub</span>
          </div>
          <h1 className="mt-16 text-4xl font-bold text-white leading-tight">
            Manage your properties<br />with confidence
          </h1>
          <p className="mt-4 text-lg text-blue-100">
            Track payments, manage tenants, schedule maintenance, and generate reports — all in one place.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-blue-100">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
            <span>List and manage properties</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
            <span>Track rent payments and finances</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
            <span>Communicate with tenants</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PropertyHub</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">{isRegister ? 'Create Account' : 'Welcome back'}</h2>
          <p className="mt-2 text-gray-500">{isRegister ? 'Sign up to get started' : 'Sign in to your account'}</p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsRegister(!isRegister); setError('') }} className="text-blue-600 font-medium hover:text-blue-700">
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {!isRegister && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Admin:</span> admin@propertyhub.com / admin123</p>
                <p><span className="font-medium">Manager:</span> manager@propertyhub.com / manager123</p>
                <p><span className="font-medium">Tenant:</span> james.wilson@email.com / tenant123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
