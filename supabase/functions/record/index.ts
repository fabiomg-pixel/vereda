// ============================================================
//  Vereda — Edge Function "record"
//  Recebe a resposta do botão (Feito / Pular) da notificação
//  e grava no estado do usuário. Identifica o usuário pelo
//  endpoint da assinatura (que só o aparelho dele conhece).
//  Deploy com "Verify JWT" DESLIGADO (o service worker chama sem login).
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const body = await req.json().catch(() => ({}));
  const { endpoint, habitId, date, answer } = body;
  if (!endpoint || !habitId || !date || !answer) {
    return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: sub } = await supabase.from("push_subs").select("user_id").eq("endpoint", endpoint).maybeSingle();
  if (!sub) return new Response(JSON.stringify({ error: "sub not found" }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });

  const uid = sub.user_id;
  const { data: row } = await supabase.from("vereda_data").select("data").eq("user_id", uid).maybeSingle();
  const state = (row && row.data) ? row.data : { habits: [], log: {}, skipped: {}, current: {}, finished: [], tombstones: {} };
  state.log = state.log || {};
  state.skipped = state.skipped || {};
  state.log[date] = state.log[date] || [];
  state.skipped[date] = state.skipped[date] || [];

  if (answer === "done") {
    if (!state.log[date].includes(habitId)) state.log[date].push(habitId);
    state.skipped[date] = state.skipped[date].filter((x: string) => x !== habitId);
  } else if (answer === "skip") {
    if (!state.skipped[date].includes(habitId)) state.skipped[date].push(habitId);
    state.log[date] = state.log[date].filter((x: string) => x !== habitId);
  }
  state.updatedAt = Date.now();

  const { error } = await supabase.from("vereda_data").upsert({ user_id: uid, data: state, updated_at: new Date().toISOString() });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
