import { createBrowserClient } from "@supabase/ssr";

const resolveSupabaseEnv = () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return { supabaseUrl, supabaseAnonKey };
};

export const createSupabaseBrowserClient = () => {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
