// ============================================================
//  Vereda — Edge Function "send-reminders"
//  Roda de minuto em minuto (via cron). Para cada aparelho inscrito,
//  calcula a hora local (fuso do aparelho), acha os hábitos cujo
//  lembrete bate com agora, ainda não feitos/pulados hoje, e dispara
//  o push com os botões Feito/Pular.
//  Deploy com "Verify JWT" DESLIGADO (o cron chama sem login).
//  Secrets necessárias: VAPID_PUBLIC, VAPID_PRIVATE, RECORD_URL
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  webpush.setVapidDetails(
    "mailto:fabiomg@biof.ufrj.br",
    Deno.env.get("VAPID_PUBLIC")!,
    Deno.env.get("VAPID_PRIVATE")!,
  );
  const RECORD_URL = Deno.env.get("RECORD_URL") || "";

  const { data: subs } = await supabase.from("push_subs").select("*");
  if (!subs || subs.length === 0) return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });

  // agrupa assinaturas por usuário (1 leitura de dados por usuário)
  const byUser: Record<string, any[]> = {};
  for (const s of subs) (byUser[s.user_id] ||= []).push(s);

  let sent = 0;
  for (const uid of Object.keys(byUser)) {
    const { data: row } = await supabase.from("vereda_data").select("data").eq("user_id", uid).maybeSingle();
    const state = row?.data;
    if (!state || !Array.isArray(state.habits)) continue;

    for (const sub of byUser[uid]) {
      const tz = sub.tz || "America/Sao_Paulo";
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz, hour12: false, weekday: "short",
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      }).formatToParts(new Date());
      const g = (t: string) => parts.find((p) => p.type === t)?.value || "";
      let hh = g("hour"); if (hh === "24") hh = "00";
      const hhmm = hh + ":" + g("minute");
      const date = g("year") + "-" + g("month") + "-" + g("day");
      const dow = DOW.indexOf(g("weekday"));

      for (const h of state.habits) {
        if (!h.reminder || h.reminder !== hhmm) continue;
        const days = h.days || [0, 1, 2, 3, 4, 5, 6];
        if (!days.includes(dow)) continue;
        const done = (state.log?.[date] || []).includes(h.id);
        const skipped = (state.skipped?.[date] || []).includes(h.id);
        if (done || skipped) continue;

        const payload = JSON.stringify({
          title: (h.emoji ? h.emoji + " " : "") + (h.name || "Vereda"),
          body: "Hora do seu hábito. Já fez?",
          habitId: h.id,
          date,
          recordUrl: RECORD_URL,
        });
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          sent++;
        } catch (e) {
          // assinatura morta → remove
          if ((e as any)?.statusCode === 410 || (e as any)?.statusCode === 404) {
            await supabase.from("push_subs").delete().eq("endpoint", sub.endpoint);
          }
        }
      }
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
