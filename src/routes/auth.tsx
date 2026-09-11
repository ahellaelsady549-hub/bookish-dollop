import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | asswany programer" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً اختيارياً على منصة asswany programer لمتابعة طلباتك ومشاريعنا." },
      { property: "og:title", content: "تسجيل الدخول | asswany programer" },
      { property: "og:description", content: "حساب اختياري على منصة asswany programer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function safeNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get("next")));
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: next, replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;

        if (data.session) {
          setMsg("تم إنشاء الحساب بنجاح.");
          return;
        }

        setMsg("تم إنشاء الحساب بنجاح، ويمكنك تسجيل الدخول الآن.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "حدث خطأ، حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }



  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-secondary/30">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 rotate-180" /> العودة للرئيسية
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-soft">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-extrabold text-lg">asswany programer</span>
          </div>

          <h1 className="font-display text-3xl font-black mb-2">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            التسجيل اختياري تماماً — يمكنك تصفح الموقع وإرسال طلبك بدون حساب.
          </p>




          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-bold mb-1.5">الاسم الكامل</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary"
                  placeholder="اسمك الثلاثي"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold mb-1.5">الإيميل</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary"
                dir="ltr"
              />
            </div>

            {err && <p className="text-sm text-destructive">{err}</p>}
            {msg && <p className="text-sm text-primary">{msg}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 rounded-xl bg-gradient-accent text-accent-foreground font-bold shadow-accent hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {busy ? "جارٍ التنفيذ..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); setMsg(null); }}
            className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "ليس لديك حساب؟ أنشئ حساباً جديداً" : "لديك حساب بالفعل؟ سجّل الدخول"}
          </button>
        </div>
      </div>
    </main>
  );
}
