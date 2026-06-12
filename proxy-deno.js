// ============================================================
//  Vereda — proxy para a API do GitHub (Deno Deploy)
//  Cole TODO este conteúdo num "Playground" em https://dash.deno.com
//  Ele só repassa chamadas /gists para api.github.com, com CORS.
//  O token NÃO é guardado: passa direto pro GitHub e volta.
// ============================================================
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Preflight CORS
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Raiz: página de saúde (serve pra testar se o proxy está no ar)
  if (url.pathname === "/" || url.pathname === "") {
    return new Response("Vereda proxy ok", { headers: { ...CORS, "Content-Type": "text/plain" } });
  }

  // Só deixa passar o que o app usa: /gists...
  if (!url.pathname.startsWith("/gists")) {
    return new Response("blocked", { status: 403, headers: CORS });
  }

  const target = "https://api.github.com" + url.pathname + url.search;
  const isBodyless = req.method === "GET" || req.method === "HEAD";

  const resp = await fetch(target, {
    method: req.method,
    headers: {
      "Authorization": req.headers.get("Authorization") || "",
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "Vereda-Proxy",
    },
    body: isBodyless ? undefined : await req.text(),
  });

  const body = await resp.text();
  return new Response(body, {
    status: resp.status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
