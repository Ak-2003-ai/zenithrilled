import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/**
 * A malformed .env must never crash the app — a bad URL falls back to demo
 * mode instead of unmounting the whole tree.
 */
const looksLikeSupabaseUrl =
  typeof url === 'string' && /^https:\/\/[a-z0-9-]+\.supabase\.[a-z]+\/?$/.test(url)

export const isSupabaseConfigured =
  looksLikeSupabaseUrl && Boolean(anonKey && anonKey.startsWith('eyJ'))

/**
 * Demo mode: the app runs fully on sample data (localStorage) when Supabase
 * hasn't been connected yet (or the connection is misconfigured), so the
 * whole site keeps working while setup is finished.
 */
export const demoMode = !isSupabaseConfigured

// One-time console diagnostic so a misconfigured .env is never silent.
if (url || anonKey) {
  const urlOk = looksLikeSupabaseUrl
  const keyOk = Boolean(anonKey && anonKey.startsWith('eyJ'))
  if (!urlOk || !keyOk) {
    console.warn(
      `[zenithrilled] Running in demo mode. URL looks right: ${urlOk ? 'yes' : `no (${JSON.stringify(url)?.slice(0, 40)}…)`}. ` +
        `Anon key looks right: ${keyOk ? 'yes' : 'no'}. Check .env, then restart the dev server.`,
    )
  }
}

let client: SupabaseClient | null = null
let clientWarned = false

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    try {
      client = createClient(url!, anonKey!, {
        auth: { persistSession: true },
      })
    } catch {
      // Never let construction throw into the render tree.
      if (!clientWarned) {
        console.warn(
          '[zenithrilled] Could not start the Supabase client — running in demo mode. ' +
            'Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in your .env.',
        )
        clientWarned = true
      }
      return null
    }
  }
  return client
}

/** Upload a file to the product-images bucket, returns a public URL. */
export async function uploadProductImage(file: File): Promise<string> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase is not configured yet (see .env)')
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  const path = `products/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_').slice(0, 40)}.${ext}`
  const { error } = await sb.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = sb.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

/** Get a temporary URL for a stored image (used when the bucket is private). */
export async function getPublicImageUrl(path: string): Promise<string> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase is not configured yet (see .env)')
  if (path.startsWith('http')) return path
  const { data } = sb.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
