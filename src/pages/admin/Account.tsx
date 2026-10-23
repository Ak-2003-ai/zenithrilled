import { useState } from 'react'
import {
  DEFAULT_ADMIN_CREDENTIALS,
  getAdminCredentials,
  getStoredAdminSession,
  saveAdminCredentials,
  setStoredAdminSession,
  updateAdminAccount,
} from '../../lib/auth'
import { Toast } from '../../components/ui'

export default function Account() {
  const currentCreds = getAdminCredentials()
  const activeSession = getStoredAdminSession()

  // Profile fields
  const [email, setEmail] = useState(activeSession?.email || currentCreds.email)
  const [displayName, setDisplayName] = useState(activeSession?.displayName || currentCreds.displayName)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone?: 'error' } | null>(null)

  const flash = (msg: string, tone?: 'error') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 3600)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      flash('Email address cannot be empty.', 'error')
      return
    }

    setBusy(true)
    try {
      const res = await updateAdminAccount({
        newEmail: email.trim(),
        displayName: displayName.trim() || email.split('@')[0],
      })
      if (!res.success) {
        flash(res.error || 'Could not update account.', 'error')
      } else {
        flash('Account details saved. Use this email to sign in next time.')
      }
    } catch (err) {
      flash((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      flash('Please enter your current password.', 'error')
      return
    }
    if (!newPassword) {
      flash('Please enter your new password.', 'error')
      return
    }
    if (newPassword.length < 4) {
      flash('New password should be at least 4 characters.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      flash('New password and confirmation do not match.', 'error')
      return
    }

    setBusy(true)
    try {
      const res = await updateAdminAccount({
        currentPassword,
        newPassword,
      })
      if (!res.success) {
        flash(res.error || 'Could not update password.', 'error')
      } else {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        flash('Password updated successfully! Use your new password on your next sign-in.')
      }
    } catch (err) {
      flash((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleResetToDefaults = () => {
    if (confirm('Reset credentials back to default (admin@zenithrilled.com / admin123)?')) {
      saveAdminCredentials(DEFAULT_ADMIN_CREDENTIALS)
      setEmail(DEFAULT_ADMIN_CREDENTIALS.email)
      setDisplayName(DEFAULT_ADMIN_CREDENTIALS.displayName)
      const session = getStoredAdminSession()
      if (session) {
        setStoredAdminSession({
          ...session,
          email: DEFAULT_ADMIN_CREDENTIALS.email,
          displayName: DEFAULT_ADMIN_CREDENTIALS.displayName,
        })
      }
      flash('Credentials reset to default (admin@zenithrilled.com / admin123).')
    }
  }

  return (
    <>
      <div className="head-row">
        <div>
          <h1 className="page-title">My account</h1>
          <p className="page-sub">
            Manage your studio admin email, display name, and login password.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
        {/* Email & Details Card */}
        <section className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>Admin Details</h2>
          <p className="muted small" style={{ marginBottom: 18 }}>
            Change the email address used to sign in to the studio, or your studio display name.
          </p>

          <form onSubmit={handleUpdateProfile}>
            <div className="field">
              <label htmlFor="acc-email">Admin Email (Sign-in Identifier)</label>
              <input
                id="acc-email"
                className="input"
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="muted small" style={{ display: 'block', marginTop: 4 }}>
                This is the email address you will use to sign in.
              </span>
            </div>

            <div className="field">
              <label htmlFor="acc-name">Studio Display Name</label>
              <input
                id="acc-name"
                className="input"
                type="text"
                placeholder="e.g. Studio Owner"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save details'}
            </button>
          </form>
        </section>

        {/* Change Password Card */}
        <section className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>Change Password</h2>
          <p className="muted small" style={{ marginBottom: 18 }}>
            Update your login password. You will need it the next time you sign in.
          </p>

          <form onSubmit={handleUpdatePassword}>
            <div className="field">
              <label htmlFor="acc-cur-pw">Current Password</label>
              <input
                id="acc-cur-pw"
                className="input"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="acc-new-pw">New Password</label>
              <input
                id="acc-new-pw"
                className="input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="acc-conf-pw">Confirm New Password</label>
              <input
                id="acc-conf-pw"
                className="input"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !currentPassword || !newPassword || !confirmPassword}
            >
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>

      <div className="panel" style={{ marginTop: 24, padding: 20, background: 'var(--paper-deep)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>Default credentials rollback</strong>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Want to reset credentials back to default? Reverts to <code>admin@zenithrilled.com</code> / <code>admin123</code>.
            </p>
          </div>
          <button type="button" className="btn btn-sm btn-danger" onClick={handleResetToDefaults}>
            Reset to default credentials
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.msg} tone={toast.tone === 'error' ? 'error' : 'ok'} onClose={() => setToast(null)} />}
    </>
  )
}
