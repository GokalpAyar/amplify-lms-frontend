import { apiUrl } from '@/config'

export async function fetcher<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Get Supabase access token saved during login
  const token = localStorage.getItem('token')

  const res = await fetch(apiUrl(path), {
    // ❌ REMOVE credentials: 'include'
    // credentials: 'include',

    credentials: 'omit', // safer for CORS

    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

