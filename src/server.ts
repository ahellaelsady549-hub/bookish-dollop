import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

async function proxyOrderFormToEmailService(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/api/contact") return null;

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(payload.name ?? "غير محدد");
  const email = String(payload.email ?? "");
  const phone = String(payload.phone ?? "");
  const type = String(payload.type ?? "غير محدد");
  const details = String(payload.details ?? "");
  const prize = payload.prize ? `${payload.prize}%` : "لم يلعب";
  const recipient = "482300926@aswan1.moe.edu.eg";

  const runtimeEnv = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const importMetaEnv = (globalThis as typeof globalThis & { __vite_ssr_import_meta__?: { env?: Record<string, string | undefined> } }).__vite_ssr_import_meta__?.env ?? {};
  const apiKey = runtimeEnv.RESEND_API_KEY ?? importMetaEnv.RESEND_API_KEY;
  const fromEmail = runtimeEnv.RESEND_FROM_EMAIL ?? importMetaEnv.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (apiKey) {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        reply_to: email || undefined,
        subject: `طلب جديد من ${name} — ${type}`,
        html: `
          <h2>طلب جديد</h2>
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>الإيميل:</strong> ${email}</p>
          <p><strong>رقم الهاتف:</strong> ${phone}</p>
          <p><strong>نوع الطلب:</strong> ${type}</p>
          <p><strong>خصم العجلة:</strong> ${prize}</p>
          <p><strong>التفاصيل:</strong></p>
          <p>${details.replace(/\n/g, "<br />")}</p>
        `,
      }),
    });

    const json = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ success: false, message: json?.message ?? "Failed to send email with Resend." }), {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully." }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
    });
  }

  return new Response(JSON.stringify({
    success: false,
    message: "Missing RESEND_API_KEY / RESEND_FROM_EMAIL in environment. Add them to deploy environment and restart the app.",
  }), {
    status: 500,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const proxied = await proxyOrderFormToEmailService(request);
      if (proxied) return proxied;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
