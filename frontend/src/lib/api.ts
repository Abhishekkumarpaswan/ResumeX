export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })
}