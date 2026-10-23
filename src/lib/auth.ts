import { getSupabase, isSupabaseConfigured } from './supabase'

export type AdminCredentials = {
  email: string
  password: string
  displayName: string
}

export type AdminSessionData = {
  id: string
  email: string
  displayName: string
  loggedInAt: string
}

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  email: 'admin@zenithrilled.com',
  password: 'admin123',
  displayName: 'Studio Owner',
}

const CREDS_STORAGE_KEY = 'zenithrilled_admin_creds'
const SESSION_STORAGE_KEY = 'zenithrilled_admin_session'

export function normalizeAdminEmail(input: string): string {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return ''
  if (!trimmed.includes('@')) {
    return `${trimmed}@zenithrilled.com`
  }
  return trimmed
}

export function getAdminCredentials(): AdminCredentials {
  const raw = localStorage.getItem(CREDS_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS))
    return { ...DEFAULT_ADMIN_CREDENTIALS }
  }
  try {
    const parsed = JSON.parse(raw)
    return {
      email: parsed.email || parsed.username || DEFAULT_ADMIN_CREDENTIALS.email,
      password: parsed.password || DEFAULT_ADMIN_CREDENTIALS.password,
      displayName: parsed.displayName || DEFAULT_ADMIN_CREDENTIALS.displayName,
    }
  } catch {
    return { ...DEFAULT_ADMIN_CREDENTIALS }
  }
}

export function saveAdminCredentials(creds: AdminCredentials): void {
  localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds))
}

export function getStoredAdminSession(): AdminSessionData | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminSessionData
  } catch {
    return null
  }
}

export function setStoredAdminSession(session: AdminSessionData | null): void {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
  window.dispatchEvent(new Event('zenithrilled-auth-change'))
}

export async function loginAdmin(
  emailOrUsername: string,
  password: string,
): Promise<{ success: boolean; error?: string; session?: AdminSessionData }> {
  const normalized = normalizeAdminEmail(emailOrUsername)
  const currentCreds = getAdminCredentials()

  // 1. Check local/demo credentials first (supports default credentials admin@zenithrilled.com / admin123)
  const isLocalMatch =
    (currentCreds.email.toLowerCase() === normalized ||
      currentCreds.email.split('@')[0].toLowerCase() === emailOrUsername.trim().toLowerCase()) &&
    currentCreds.password === password

  if (isLocalMatch) {
    const session: AdminSessionData = {
      id: 'admin-local',
      email: currentCreds.email,
      displayName: currentCreds.displayName,
      loggedInAt: new Date().toISOString(),
    }
    setStoredAdminSession(session)
    return { success: true, session }
  }

  // 2. If Supabase is connected, attempt Supabase Auth sign-in
  const sb = getSupabase()
  if (isSupabaseConfigured && sb) {
    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: normalized,
        password,
      })
      if (!error && data.user) {
        // Fetch or create admin_users profile
        const { data: adminRow } = await sb
          .from('admin_users')
          .select('display_name')
          .eq('auth_uid', data.user.id)
          .maybeSingle()

        let disp = (adminRow as { display_name?: string } | null)?.display_name
        if (!disp) {
          disp = data.user.email?.split('@')[0] || 'Studio Owner'
          try {
            await sb.from('admin_users').insert({
              auth_uid: data.user.id,
              display_name: disp,
            })
          } catch {
            // Ignore insert error if row already exists
          }
        }

        const session: AdminSessionData = {
          id: data.user.id,
          email: data.user.email ?? normalized,
          displayName: disp,
          loggedInAt: new Date().toISOString(),
        }
        setStoredAdminSession(session)
        return { success: true, session }
      }
    } catch {
      // Fall through to error
    }
  }

  return { success: false, error: 'Invalid email or password.' }
}

export async function updateAdminAccount(params: {
  currentPassword?: string
  newEmail?: string
  newPassword?: string
  displayName?: string
}): Promise<{ success: boolean; error?: string }> {
  const currentCreds = getAdminCredentials()

  // Validate current password if attempting to change password
  if (params.newPassword && params.currentPassword !== currentCreds.password) {
    return { success: false, error: 'Current password is incorrect.' }
  }

  const updatedEmail = params.newEmail ? normalizeAdminEmail(params.newEmail) : currentCreds.email
  const updatedPassword = params.newPassword?.trim() ? params.newPassword.trim() : currentCreds.password
  const updatedDisplayName = params.displayName?.trim() ? params.displayName.trim() : currentCreds.displayName

  const updated: AdminCredentials = {
    email: updatedEmail,
    password: updatedPassword,
    displayName: updatedDisplayName,
  }

  saveAdminCredentials(updated)

  // Also update Supabase if configured & authenticated
  const sb = getSupabase()
  if (isSupabaseConfigured && sb) {
    try {
      const updates: { password?: string; email?: string } = {}
      if (params.newPassword) updates.password = params.newPassword
      if (params.newEmail) updates.email = updatedEmail

      if (Object.keys(updates).length > 0) {
        await sb.auth.updateUser(updates)
      }

      const { data: { user } } = await sb.auth.getUser()
      if (user && params.displayName) {
        await sb
          .from('admin_users')
          .update({ display_name: params.displayName })
          .eq('auth_uid', user.id)
      }
    } catch {
      // Non-fatal if Supabase sync fails while running in hybrid mode
    }
  }

  // Update active session in browser
  const currentSession = getStoredAdminSession()
  if (currentSession) {
    setStoredAdminSession({
      ...currentSession,
      email: updated.email,
      displayName: updated.displayName,
    })
  }

  return { success: true }
}
