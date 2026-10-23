import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toast } from '../../components/ui'
import { DEFAULT_ADMIN_CREDENTIALS, getAdminCredentials, getStoredAdminSession, loginAdmin } from '../../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone?: 'error' } | null>(null)

  // If already logged in, redirect directly into the admin panel
  useEffect(() => {
    const session = getStoredAdminSession()
    if (session) {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  const flash = (msg: string, tone?: 'error') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 3600)
  }

  const fillDefaults = () => {
    const creds = getAdminCredentials()
    setEmail(creds.email)
    setPassword(creds.password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      flash('Please enter both your email and password.', 'error')
      return
    }

    setBusy(true)
    try {
      const res = await loginAdmin(email, password)
      if (!res.success) {
        flash(res.error || 'Invalid credentials.', 'error')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      flash((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card panel">
        <div className="side-brand" style={{ marginBottom: 14 }}>
          <img src="/logo.png" alt="Zenithrilled logo" width="38" height="38" style={{ borderRadius: '50%', objectFit: 'cover' }} />
          <span className="wordmark">Zenithrilled</span>
        </div>

        <h1>Sign in to the studio</h1>
        <p className="sub">
          This is the private management side — products, stock, orders, and sales analytics.
        </p>

        <div className="notice" style={{ margin: '0 0 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <strong>Default admin credentials:</strong>
            <div style={{ marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
              Email: <b>{DEFAULT_ADMIN_CREDENTIALS.email}</b><br />
              Password: <b>{DEFAULT_ADMIN_CREDENTIALS.password}</b>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>You can change these anytime in <b>My account</b>.</span>
            <button type="button" className="btn btn-sm" onClick={fillDefaults} style={{ alignSelf: 'flex-start' }}>
              Auto-fill
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="l-email">Admin Email</label>
            <input
              id="l-email"
              className="input"
              type="text"
              inputMode="email"
              autoComplete="username email"
              placeholder="admin@zenithrilled.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="l-pw">Password</label>
            <input
              id="l-pw"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={busy || !email || !password}
          >
            {busy ? 'Verifying…' : 'Sign in'}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast.msg} tone={toast.tone === 'error' ? 'error' : 'ok'} onClose={() => setToast(null)} />}
    </div>
  )
}
