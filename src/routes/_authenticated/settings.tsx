import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, KeyRound, Mail, LogOut, Settings as SettingsIcon, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "الإعدادات | asswany programer" },
      { name: "description", content: "إعدادات الحساب: تغيير البريد الإلكتروني، كلمة المرور، أو تسجيل الخروج." },
    ],
  }),
});

function SettingsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? "");

      if (userData.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!roleData);
      }
    })();
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailMessage(null);

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setEmailError("اكتب البريد الإلكتروني الجديد.");
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
      if (error) throw error;
      setEmailMessage("تم إرسال طلب تحديث البريد الإلكتروني. راجع بريدك الإلكتروني لتأكيد التغيير.");
      setNewEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ أثناء تحديث البريد الإلكتروني.";
      setEmailError(message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("كلمة المرور يجب أن تكون 6 أحرف أو أكثر.");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage("تم تحديث كلمة المرور بنجاح.");
      setNewPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ أثناء تحديث كلمة المرور.";
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <main className="min-h-screen px-6 py-12 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 rotate-180" /> العودة للرئيسية
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
            <SettingsIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">الإعدادات</span>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-[2rem] border border-border bg-gradient-hero p-6 text-primary-foreground shadow-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm/6 text-primary-foreground/75">حسابك</p>
                <h1 className="font-display text-3xl font-black">إعدادات الحساب</h1>
              </div>
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-sm">
              {email || "غير متاح"}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleUpdateEmail} className="rounded-[2rem] border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="font-display text-2xl font-black">تغيير البريد الإلكتروني</h2>
            </div>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="البريد الإلكتروني الجديد"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary"
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            {emailMessage && <p className="text-sm text-green-600">{emailMessage}</p>}
            <button type="submit" disabled={emailLoading} className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-60">
              {emailLoading ? "جارٍ التحديث..." : "تحديث البريد الإلكتروني"}
            </button>
          </form>

          <form onSubmit={handleUpdatePassword} className="rounded-[2rem] border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="font-display text-2xl font-black">تغيير كلمة المرور</h2>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary"
            />
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}
            <button type="submit" disabled={passwordLoading} className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-60">
              {passwordLoading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-card text-sm font-bold hover:bg-accent/10 transition-colors">
              <ShieldCheck className="w-4 h-4" /> لوحة نشر المشاريع
            </Link>
          )}
          <button onClick={handleSignOut} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-destructive text-destructive-foreground font-bold hover:opacity-90 transition-opacity">
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>
      </div>
    </main>
  );
}
