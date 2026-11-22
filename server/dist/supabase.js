import { createClient } from "@supabase/supabase-js";
let cached;
export function getSupabase() {
    if (cached) {
        return cached;
    }
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_ANON_KEY");
    }
    cached = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    return cached;
}
// Per-user client: uses the anon key but sends the caller's access token so that
// Postgres RLS policies evaluate auth.uid() as the requesting user.
export function createUserSupabase(accessToken) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_ANON_KEY");
    }
    return createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
}
export function resetSupabaseClientForTests() {
    cached = undefined;
}
