import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";
import { createOAuthClient } from "@/lib/google/oauth";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", env.appUrl));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = cookies().get("google_oauth_state")?.value;

  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(
      new URL("/admin/google?error=invalid_state", env.appUrl),
    );
  }

  // troca o code por tokens
  const oauth = createOAuthClient();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      new URL("/admin/google?error=no_refresh_token", env.appUrl),
    );
  }
  oauth.setCredentials(tokens);

  // pega o email do dono da conta
  const userinfo = await google.oauth2({ version: "v2", auth: oauth }).userinfo.get();
  const email = userinfo.data.email ?? null;

  // salva como singleton no banco (id=1)
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("google_credentials")
    .upsert({
      id: 1,
      refresh_token: tokens.refresh_token,
      calendar_id: "primary",
      connected_email: email,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/google?error=${encodeURIComponent(error.message)}`, env.appUrl),
    );
  }

  cookies().delete("google_oauth_state");
  return NextResponse.redirect(new URL("/admin/google?ok=1", env.appUrl));
}
