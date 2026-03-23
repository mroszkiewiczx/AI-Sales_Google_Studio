import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in environment variables.");
    }

    // In AI Studio preview, we point functions to our own Express server
    const functionsUrl = window.location.origin + "/functions/v1";
    console.log("Initializing Supabase with functionsUrl:", functionsUrl);

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          "x-user-id": "00000000-0000-0000-0000-000000000000" // Mock user ID for demo
        }
      },
      functions: {
        url: functionsUrl
      }
    } as any);
  }
  return supabaseInstance;
};

// For backward compatibility with existing code, we can export a proxy or just update the calls.
// Since I just created the code, I'll update the calls in the hooks.
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const instance = getSupabase();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
