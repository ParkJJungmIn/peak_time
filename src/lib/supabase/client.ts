import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type BrowserSupabaseClient = SupabaseClient;
export type ServiceSupabaseClient = SupabaseClient;

/**
 * Factory for browser/client-side Supabase usage.
 * Use inside React components or client-side hooks only.
 */
export function createSupabaseBrowserClient(): BrowserSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
  }

  return createClient(url, anonKey);
}

/**
 * Factory for server-side Supabase usage (e.g., Route Handlers, Server Actions).
 * Never expose the service role key to the browser.
 */
export function createSupabaseServiceRoleClient(): ServiceSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
