import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2, Plus, ShieldAlert, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "لوحة نشر المشاريع | asswany programer" },
      { name: "description", content: "لوحة خاصة بصاحب المنصة لنشر وإدارة المشاريع المعروضة في قسم الأعمال." },
      { property: "og:title", content: "لوحة نشر المشاريع | asswany programer" },
      { property: "og:description", content: "إدارة مشاريع asswany programer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Project = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  published: boolean;
};

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("id,title,description,url,image_url,published")
      .order("created_at", { ascending: false });
    setProjects((data ?? []) as Project[]);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? "");
      if (!userData.user) return;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!roleData);
      if (roleData) await load();
    })();
  }, [load]);

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      let uploadedImageUrl: string | null = null;

      if (imageFile) {
        const safeName = imageFile.name
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9._-]/g, "-");
        const filePath = `project-images/${Date.now()}-${safeName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type || "image/png",
          });

        if (uploadError) {
          throw new Error(uploadError.message || "فشل رفع الصورة.");
        }

        const { data: publicUrlData } = supabase.storage.from("project-images").getPublicUrl(uploadData.path);
        uploadedImageUrl = publicUrlData.publicUrl || null;
      }

      const { error } = await supabase.from("projects").insert({
        title,
        description: description || null,
        url: url || null,
        image_url: uploadedImageUrl,
        created_by: userData.user?.id ?? null,
      });

      if (error) throw new Error(error.message);

      setTitle("");
      setDescription("");
      setUrl("");
      setImageFile(null);
      setImagePreview(null);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("projects").delete().eq("id", id);
    await load();
  }

  async function togglePublish(p: Project) {
    await supabase.from("projects").update({ published: !p.published }).eq("id", p.id);
    await load();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (isAdmin === false) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-card border border-border rounded-3xl p-10 shadow-soft">
          <ShieldAlert className="w-10 h-10 mx-auto mb-4 text-destructive" />
          <h1 className="font-display text-2xl font-black mb-2">هذه الصفحة لصاحب المنصة فقط</h1>
          <p className="text-muted-foreground text-sm mb-6">
            حسابك الحالي ({email}) لا يملك صلاحية نشر المشاريع.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold">
            العودة للرئيسية
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 rotate-180" /> العودة للرئيسية
          </Link>
          <button onClick={signOut} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>

        <h1 className="font-display text-4xl font-black mb-2">نشر المشاريع</h1>
        <p className="text-muted-foreground mb-8">أضف مشاريعك لتظهر مباشرة في قسم «أعمالنا».</p>

        <form onSubmit={addProject} className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4 mb-10">
          <div>
            <label className="block text-sm font-bold mb-1.5">اسم المشروع</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary resize-none" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">رابط الموقع</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">إرفاق صورة من الجهاز</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  setImagePreview(file ? URL.createObjectURL(file) : null);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none focus:border-primary file:mr-2 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:font-bold file:cursor-pointer"
              />
              {imagePreview && (
                <img src={imagePreview} alt="معاينة المشروع" className="mt-3 h-28 w-full object-cover rounded-xl border border-border" />
              )}
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button disabled={busy} type="submit" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-accent text-accent-foreground font-bold shadow-accent disabled:opacity-60">
            <Plus className="w-4 h-4" /> {busy ? "جارٍ الإضافة..." : "إضافة المشروع"}
          </button>
        </form>

        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg">{p.title}</h3>
                {p.description && <p className="text-muted-foreground text-sm">{p.description}</p>}
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm" dir="ltr">{p.url}</a>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish(p)} className="px-3 py-1.5 rounded-full border border-border text-xs font-bold">
                  {p.published ? "منشور" : "مخفي"}
                </button>
                <button onClick={() => remove(p.id)} aria-label="حذف" className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && isAdmin && <p className="text-muted-foreground text-sm">لا توجد مشاريع بعد.</p>}
        </div>
      </div>
    </main>
  );
}
