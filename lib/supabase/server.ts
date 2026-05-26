import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Client com sessão do usuário (lê/grava cookie). Use em Server Components/Route Handlers
// onde precisar saber se o admin está logado.
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // chamado de um Server Component (não pode escrever cookie) — ignora
        }
      },
    },
  });
}

// Client com SERVICE ROLE — ignora RLS. Use APENAS em rotas server-side
// para operações privilegiadas (ler refresh token, gerenciar admins, etc).
// NUNCA expor essa key no client.
export function createSupabaseAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
