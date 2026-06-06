import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Perform an authenticated API request to the FastAPI backend.
 * Automatically extracts the Supabase session token and attaches it to the Authorization header.
 */
export async function apiRequest(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    let errJson;
    try {
      errJson = JSON.parse(errText);
    } catch {
      errJson = null;
    }
    throw new Error(errJson?.detail || `Request failed with status ${response.status}`);
  }

  // Handle empty or void responses safely
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
