import type { ReactNode } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAdmin } from '../../lib/hooks'
import { demoMode } from '../../lib/supabase'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/orders', label: 'Orders', end: false },
  { to: '/admin/analytics', label: 'Analytics', end: false },
  { to: '/admin/account', label: 'My account', end: false },
]

export default function AdminLayout() {
  const { session, isAdmin, loading, displayName, signOut } = useAdmin()

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="muted">Checking your access…</div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  if (demoMode) {
    return (
      <DemoBanner>
        <AdminShell displayName={displayName ?? 'Studio Owner'} onSignOut={signOut} />
      </DemoBanner>
    )
  }

  return <AdminShell displayName={displayName} onSignOut={signOut} />
}

function DemoBanner({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="toast-demo" role="note">
        <strong>Demo mode.</strong> Supabase isn't connected, so you're browsing with sample data.
        Finish the setup in <code className="kbd">README.md</code> to use the real shop.
      </div>
      {children}
    </>
  )
}

function AdminShell({
  displayName,
  onSignOut,
}: {
  displayName: string | null
  onSignOut: () => void
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="side-brand-row">
          <div className="side-brand">
            <span className="wordmark">
              <img src="/logo.png" alt="Zenithrilled logo" width="34" height="34" style={{ borderRadius: '50%', objectFit: 'cover' }} />
              Zenithrilled
            </span>
          </div>

          <div className="mobile-admin-actions">
            <button className="btn btn-sm btn-signout" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>

        <nav className="side-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>
            View shop ↗
          </NavLink>
        </nav>

        <div className="side-foot desktop-only">
          <span className="side-user" title={displayName ?? undefined}>
            {displayName}
          </span>
          <button className="btn btn-sm" onClick={onSignOut}>Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
