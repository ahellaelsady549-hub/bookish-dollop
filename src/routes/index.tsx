import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-coding.jpg";
import workEs3efnny from "@/assets/work-es3efnny.png";
import workUmmaty from "@/assets/1_3.PNG";
import workPharmacy from "@/assets/1_4.PNG";
import workUnistay from "@/assets/1_5.PNG";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Code2, FileText, ShoppingBag, Layout, Facebook, Sparkles, ArrowLeft, PenTool, ExternalLink, Construction, Send, CheckCircle2, Moon, Sun, Gift, Megaphone, Package, Star, Mail, Phone, User as UserIcon, LogIn, ShieldCheck, Smartphone, Languages } from "lucide-react";

type DbProject = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
};


type Review = {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  comment: string;
  date: string;
};

const WHEEL_PRIZES = [5, 10, 15, 20, 25, 30];
const WHEEL_COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

export const Route = createFileRoute("/")({
  component: Index,
});

const services = [
  { icon: Code2, title: "تطوير المواقع", desc: "مواقع سريعة، متجاوبة، ومصممة بمعايير احترافية تواكب أحدث التقنيات." },
  { icon: FileText, title: "إنشاء CV احترافي", desc: "سير ذاتية مميزة تبرز مهاراتك وتفتح لك أبواب الفرص." },
  { icon: ShoppingBag, title: "متاجر إلكترونية", desc: "متاجر متكاملة بتجربة شراء سلسة وإدارة سهلة لمنتجاتك." },
  { icon: Layout, title: "صفحات بورتفوليو", desc: "صفحات شخصية تحكي قصتك وتعرض أعمالك بأسلوب جذاب." },
  { icon: PenTool, title: "تصميم الشعارات (لوجوهات)", desc: "هويات بصرية وشعارات مميزة تعكس شخصية مشروعك وتترك انطباعاً لا يُنسى." },
  { icon: Megaphone, title: "إدارة صفحات السوشيال ميديا", desc: "إدارة محتوى وتفاعل احترافي لصفحاتك على فيسبوك وإنستجرام لتنمية جمهورك." },
  { icon: Package, title: "إدارة المنتجات", desc: "تنظيم، تصنيف، وتحديث منتجات متجرك مع وصف جذاب وصور احترافية." },
  { icon: Smartphone, title: "إنشاء تطبيقات الموبايل", desc: "تطبيقات أندرويد و iOS سريعة وسهلة الاستخدام لمشروعك أو متجرك." },
  { icon: Languages, title: "محتوى وواجهات بالإنجليزية", desc: "مواقع وسير ذاتية وتطبيقات بلغة إنجليزية احترافية تناسب السوق العالمي." },
];


function Index() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<number | null>(null);
  const [alreadySpun, setAlreadySpun] = useState(false);

  // Optional auth state
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [dbProjects, setDbProjects] = useState<DbProject[]>([]);

  useEffect(() => {
    const syncUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setAuthEmail(user?.email ?? null);
      if (!user) { setIsOwner(false); return; }
      const { data: role } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsOwner(!!role);
    };
    void syncUser();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void syncUser();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id,title,description,url,image_url")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setDbProjects((data ?? []) as DbProject[]);
    })();
  }, []);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rRating, setRRating] = useState(0);
  const [rHover, setRHover] = useState(0);
  const [rComment, setRComment] = useState("");
  const [rError, setRError] = useState<string | null>(null);
  const [rSent, setRSent] = useState(false);

  const heroRef = useRef<HTMLElement | null>(null);
  const dotsBackRef = useRef<HTMLDivElement | null>(null);
  const dotsFrontRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const updateParallax = (clientX: number, clientY: number) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    targetRef.current.x = ((clientX - r.left) / r.width - 0.5) * 80;
    targetRef.current.y = ((clientY - r.top) / r.height - 0.5) * 80;
    if (rafRef.current == null) {
      const tick = () => {
        const t = targetRef.current;
        const c = currentRef.current;
        c.x += (t.x - c.x) * 0.12;
        c.y += (t.y - c.y) * 0.12;
        if (dotsBackRef.current) {
          dotsBackRef.current.style.transform = `translate3d(${c.x * 0.35}px, ${c.y * 0.35}px, 0)`;
        }
        if (dotsFrontRef.current) {
          dotsFrontRef.current.style.transform = `translate3d(${c.x * 1}px, ${c.y * 1}px, 0)`;
        }
        if (Math.abs(t.x - c.x) > 0.1 || Math.abs(t.y - c.y) > 0.1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefers = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : !!prefers;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    if (typeof window !== "undefined" && localStorage.getItem("wheelPrize")) {
      setAlreadySpun(true);
      setPrize(Number(localStorage.getItem("wheelPrize")));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("reviews");
      if (raw) setReviews(JSON.parse(raw));
    } catch {}
  }, []);

  const submitReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRError(null);
    const name = rName.trim();
    const phone = rPhone.trim();
    const email = rEmail.trim();
    const comment = rComment.trim();
    if (!name || name.length > 60) return setRError("اكتب اسمك (أقل من 60 حرف).");
    if (!/^[0-9+\s-]{7,20}$/.test(phone)) return setRError("رقم تليفون غير صحيح.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) return setRError("إيميل غير صحيح.");
    if (rRating < 1 || rRating > 5) return setRError("اختر تقييم من 1 إلى 5 نجوم.");
    if (!comment || comment.length > 500) return setRError("اكتب تعليق (أقل من 500 حرف).");
    const newReview: Review = {
      id: crypto.randomUUID(),
      name, phone, email,
      rating: rRating,
      comment,
      date: new Date().toISOString(),
    };
    const next = [newReview, ...reviews];
    setReviews(next);
    try { localStorage.setItem("reviews", JSON.stringify(next)); } catch {}
    setRName(""); setRPhone(""); setREmail(""); setRRating(0); setRComment("");
    setRSent(true);
    setTimeout(() => setRSent(false), 3000);
  };

  const resetWheelState = () => {
    setPrize(null);
    setAlreadySpun(false);
    setWheelAngle(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("wheelPrize");
    }
  };

  const spinWheel = () => {
    if (spinning || alreadySpun) return;
    setSpinning(true);
    const idx = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const segDeg = 360 / WHEEL_PRIZES.length;
    const targetAngle = 360 * 6 + (360 - (idx * segDeg + segDeg / 2));
    setWheelAngle(targetAngle);
    setTimeout(() => {
      const won = WHEEL_PRIZES[idx];
      setPrize(won);
      setSpinning(false);
      setAlreadySpun(true);
      localStorage.setItem("wheelPrize", String(won));
    }, 4200);
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          type: String(fd.get("type") ?? ""),
          details: String(fd.get("details") ?? ""),
          prize: prize ?? null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) throw new Error("failed");

      setSent(true);
      resetWheelState();
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("حدث خطأ، حاول مرة أخرى أو تواصل معنا على واتساب.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-extrabold text-lg">asswany programer</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">خدماتنا</a>
            <a href="#works" className="hover:text-foreground transition-colors">أعمالنا</a>
            
            <a href="#order" className="hover:text-foreground transition-colors">اطلب الآن</a>
            <a href="#reviews" className="hover:text-foreground transition-colors">التقييمات</a>
            <a href="#contact" className="hover:text-foreground transition-colors">تواصل</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent/10 transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {authEmail ? (
              <>
                {isOwner && (
                  <Link to="/admin" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-bold hover:bg-accent/10 transition-colors">
                    <ShieldCheck className="w-4 h-4" /> نشر المشاريع
                  </Link>
                )}
                <Link to="/settings" aria-label="الإعدادات" title="الإعدادات" className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border hover:bg-accent/10 transition-colors">
                  <UserIcon className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-bold hover:bg-accent/10 transition-colors"
              >
                <LogIn className="w-4 h-4" /> دخول
              </Link>
            )}
            <a
              href="https://www.facebook.com/share/1KQTn54X1M/"
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-accent text-accent-foreground text-sm font-bold shadow-accent hover:scale-105 transition-transform"
            >
              <Facebook className="w-4 h-4" /> صفحتنا
            </a>
          </div>

        </div>
      </header>

      {/* HERO */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-20 overflow-hidden bg-gradient-hero"
        onMouseMove={(e) => updateParallax(e.clientX, e.clientY)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) updateParallax(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) updateParallax(t.clientX, t.clientY);
        }}
      >
        <div
          ref={dotsBackRef}
          className="absolute inset-0 opacity-10 pointer-events-none will-change-transform"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 35%, white 1.5px, transparent 1.5px), radial-gradient(circle at 75% 65%, white 1.5px, transparent 1.5px)",
            backgroundSize: "120px 120px",
          }}
        />
        <div
          ref={dotsFrontRef}
          className="absolute inset-0 opacity-25 pointer-events-none will-change-transform"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-primary-foreground animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
              متاحون لاستقبال مشاريعك
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black leading-[1.1] mb-6">
              نحوّل أفكارك إلى
              <span className="block text-gradient mt-2">منتجات رقمية</span>
              تلهم وتُحقّق نتائج
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl leading-relaxed">
              مبرمج متخصص في تطوير المواقع، المتاجر الإلكترونية، وصفحات البورتفوليو، وإنشاء السير الذاتية الاحترافية.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#services" className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-gradient-accent text-accent-foreground font-bold shadow-accent hover:scale-105 transition-transform">
                ابدأ مشروعك <ArrowLeft className="w-4 h-4" />
              </a>
              <a href="#team" className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/10 border border-white/30 text-primary-foreground font-bold backdrop-blur-sm hover:bg-white/20 transition-colors">
                تعرّف على الفريق
              </a>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[["+50", "مشروع"], ["1", "مطوّر"], ["100%", "رضا العملاء"]].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-3xl font-black text-accent">{n}</div>
                  <div className="text-sm text-primary-foreground/70 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute -inset-6 bg-gradient-accent rounded-3xl opacity-30 blur-3xl" />
            <img src={heroImg} alt="مطور asswany programer" className="relative rounded-3xl shadow-glow w-full tilt-3d" />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold mb-4">خدماتنا</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-4">كل ما تحتاجه لحضور رقمي قوي</h2>
            <p className="text-muted-foreground text-lg">نقدّم باقة متكاملة من الخدمات المصمّمة خصيصاً لتنمية مشروعك وتعزيز هويتك على الإنترنت.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 perspective-1000">
            {services.map((s, i) => (
              <div key={s.title} className="card-3d group relative bg-slate-200 p-8 rounded-2xl border-slate-400 border text-slate-500 shadow-soft hover:shadow-glow" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                <div className="absolute top-6 left-6 font-display text-5xl font-black text-muted/40 group-hover:text-accent/30 transition-colors">0{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKS */}
      <section id="works" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold mb-4">أعمالنا</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-4">من <span className="text-gradient">إنجازاتنا</span></h2>
            <p className="text-muted-foreground text-lg">مواقع وتطبيقات نفّذناها لعملائنا — والقادم أجمل بإذن الله.</p>
          </div>

          {/* Under construction notice */}
          <div className="max-w-3xl mx-auto mb-12 p-5 rounded-2xl border border-accent/30 bg-accent/10 flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-accent flex items-center justify-center shadow-accent">
              <Construction className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="text-sm md:text-base">
              <p className="font-display font-bold text-foreground mb-1">المنصّة لا تزال تحت الإنشاء</p>
              <p className="text-muted-foreground leading-relaxed">
                فكرة <strong className="text-foreground">asswany programer</strong> ما زالت في طور التطوير ولم تكتمل بعد. ننفّذ حالياً عدة مشاريع لعملائنا، وأعمالنا القادمة في الطريق.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div
              className="group block rounded-3xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-glow transition-all duration-500 hover:-translate-y-1"
            >
              <div className="relative overflow-hidden bg-gradient-hero">
                <img
                  src={workEs3efnny}
                  alt="موقع إسعفني — رفيقك الصحي"
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">موقع طبي</span>
                    <span className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">عميل حقيقي</span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-black mb-1">إسعفني — رفيقك الصحي</h3>
                  <p className="text-muted-foreground text-sm">إرشادات طبية سريعة، نصائح للإسعافات الأولية، ودعم الطوارئ في متناول يدك.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8 perspective-1000">
              {[
                {
                  img: workUmmaty,
                  title: "أُمّتي — تطبيق وموقع إسلامي",
                  desc: "المصحف كاملاً بأصوات كبار القرّاء، مواقيت الصلاة، الأذكار، السبحة، ومكتبة الأحاديث.",
                  tags: ["موقع وتطبيق", "منشور"],
                  url: null,
                },
                {
                  img: workPharmacy,
                  title: "تطبيق إدارة مبيعات صيدلية",
                  desc: "لوحة تحكم شاملة: نقطة البيع، المخزون والأصناف، المشتريات، الموردين، والأرباح اليومية.",
                  tags: ["تطبيق إدارة", "عميل حقيقي"],
                  url: null,
                },
                {
                  img: workUnistay,
                  title: "UNIstay finder",
                  desc: "تطبيق للبحث عن السكن الجامعي في كل محافظات مصر بأسعار واضحة وتواصل مباشر مع الملاك.",
                  tags: ["تطبيق", "تحت الإنشاء"],
                  url: null,
                },
              ].map((p) => (
                <div key={p.title} className="card-3d group rounded-3xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-glow">
                  <div className="overflow-hidden bg-secondary/40">
                    <img src={p.img} alt={p.title} loading="lazy" className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {p.tags.map((t) => (
                        <span key={t} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">{t}</span>
                      ))}
                    </div>
                    <h3 className="font-display text-xl font-black mb-2">{p.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>



            {dbProjects.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {dbProjects.map((p) => (
                  <div key={p.id} className="rounded-3xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-glow transition-all duration-500 hover:-translate-y-1">
                    {p.image_url && (
                      <img src={p.image_url} alt={p.title} loading="lazy" className="w-full h-auto" />
                    )}
                    <div className="p-6">
                      <h3 className="font-display text-xl font-black mb-2">{p.title}</h3>
                      {p.description && <p className="text-muted-foreground text-sm mb-4">{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>


      {/* ORDER FORM */}
      <section id="order" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">اطلب الآن</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-4">أنشئ <span className="text-gradient">طلبك</span></h2>
            <p className="text-muted-foreground text-lg">املأ النموذج وسنرد عليك في أقرب وقت.</p>
          </div>

          {sent ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-soft">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-accent flex items-center justify-center shadow-accent">
                <CheckCircle2 className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-display text-2xl font-black mb-2">تم إرسال طلبك بنجاح</h3>
              <p className="text-muted-foreground">سنتواصل معك قريباً على الإيميل.</p>
              <button onClick={() => setSent(false)} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform">
                إرسال طلب آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-soft space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold mb-2">الاسم ثلاثي <span className="text-accent">*</span></label>
                  <input
                    required name="name" type="text" placeholder="خالد أحمد السيد"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">الإيميل <span className="text-accent">*</span></label>
                  <input
                    required name="email" type="email" placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">رقم الهاتف <span className="text-accent">*</span></label>
                <input
                  required name="phone" type="tel" placeholder="01012345678"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">نوع الطلب <span className="text-accent">*</span></label>
                <select
                  required name="type" defaultValue=""
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                >
                  <option value="" disabled>اختر نوع الطلب…</option>
                  <option value="موقع بورتفوليو">موقع بورتفوليو</option>
                  <option value="موقع لشركة">موقع لشركة</option>
                  <option value="موقع لمطعم">موقع لمطعم</option>
                  <option value="تصميم لوجو">تصميم لوجو</option>
                  <option value="إنشاء CV">إنشاء CV</option>
                  <option value="إدارة سوشيال ميديا">إدارة سوشيال ميديا</option>
                  <option value="إدارة منتجات">إدارة منتجات</option>
                  <option value="تطبيق موبايل">تطبيق موبايل</option>
                  <option value="محتوى بالإنجليزية">موقع/CV بالإنجليزية</option>
                  <option value="أخرى">أخرى (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">تفاصيل الطلب <span className="text-accent">*</span></label>
                <textarea
                  required name="details" rows={6} placeholder="اكتب وصفاً مفصلاً لمشروعك، الألوان المفضلة، أمثلة، الميزانية، الموعد…"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* WHEEL OF FORTUNE */}
              <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-accent" />
                  <h4 className="font-display font-black text-lg">عجلة الحظ — اربح خصم من 5% إلى 30%</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-4">لفّة واحدة فقط لكل عميل! الخصم اللي هتكسبه هيتبعت مع طلبك.</p>

                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-56 h-56">
                    {/* pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-accent drop-shadow-md" />
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full"
                      style={{
                        transform: `rotate(${wheelAngle}deg)`,
                        transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.21, 1)" : "none",
                      }}
                    >
                      {WHEEL_PRIZES.map((p, i) => {
                        const seg = 360 / WHEEL_PRIZES.length;
                        const start = i * seg - 90;
                        const end = start + seg;
                        const rad = (deg: number) => (deg * Math.PI) / 180;
                        const x1 = 100 + 100 * Math.cos(rad(start));
                        const y1 = 100 + 100 * Math.sin(rad(start));
                        const x2 = 100 + 100 * Math.cos(rad(end));
                        const y2 = 100 + 100 * Math.sin(rad(end));
                        const mid = start + seg / 2;
                        const tx = 100 + 62 * Math.cos(rad(mid));
                        const ty = 100 + 62 * Math.sin(rad(mid));
                        return (
                          <g key={p}>
                            <path
                              d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                              fill={WHEEL_COLORS[i]}
                              stroke="#fff"
                              strokeWidth="2"
                            />
                            <text
                              x={tx} y={ty}
                              fill="#fff" fontSize="18" fontWeight="900"
                              textAnchor="middle" dominantBaseline="middle"
                              transform={`rotate(${mid + 90}, ${tx}, ${ty})`}
                            >
                              {p}%
                            </text>
                          </g>
                        );
                      })}
                      <circle cx="100" cy="100" r="14" fill="#fff" stroke="#0002" strokeWidth="2" />
                    </svg>
                  </div>

                  {prize !== null ? (
                    <div className="text-center">
                      <p className="font-display font-black text-xl text-accent">🎉 مبروك! ربحت خصم {prize}%</p>
                      <p className="text-xs text-muted-foreground mt-1">سيُرفق الخصم تلقائياً مع طلبك.</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={spinWheel}
                      disabled={spinning || alreadySpun}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-accent text-accent-foreground font-bold shadow-accent hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {spinning ? "جاري اللف…" : alreadySpun ? "تم الاستخدام" : "لف العجلة"}
                    </button>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit" disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-gradient-accent text-accent-foreground font-bold shadow-accent hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "جاري الإرسال…" : <>إرسال الطلب <Send className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-muted-foreground text-center">سيصلنا طلبك مباشرة على الإيميل وسنرد عليك في أقرب وقت.</p>
            </form>
          )}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold mb-4">آراء العملاء</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-4">قيّم <span className="text-gradient">تجربتك</span> معنا</h2>
            <p className="text-muted-foreground text-lg">شاركنا رأيك وساعد غيرك في اتخاذ القرار.</p>
          </div>

          <form onSubmit={submitReview} className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft space-y-5 mb-12">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2"><UserIcon className="inline w-4 h-4 ml-1" /> الاسم</label>
                <input value={rName} onChange={(e) => setRName(e.target.value)} maxLength={60} placeholder="اسمك" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2"><Phone className="inline w-4 h-4 ml-1" /> رقم الموبايل</label>
                <input value={rPhone} onChange={(e) => setRPhone(e.target.value)} maxLength={20} placeholder="01XXXXXXXXX" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2"><Mail className="inline w-4 h-4 ml-1" /> الإيميل</label>
                <input value={rEmail} onChange={(e) => setREmail(e.target.value)} type="email" maxLength={100} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" dir="ltr" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">التقييم</label>
              <div className="flex items-center gap-1" onMouseLeave={() => setRHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (rHover || rRating) >= n;
                  return (
                    <button key={n} type="button" onClick={() => setRRating(n)} onMouseEnter={() => setRHover(n)} aria-label={`${n} نجوم`} className="p-1 transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 ${active ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
                    </button>
                  );
                })}
                {rRating > 0 && <span className="mr-2 text-sm font-bold text-accent">{rRating}/5</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">تعليقك</label>
              <textarea value={rComment} onChange={(e) => setRComment(e.target.value)} maxLength={500} rows={4} placeholder="شاركنا تجربتك معنا…" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none" />
            </div>

            {rError && <p className="text-sm text-destructive">{rError}</p>}
            {rSent && <p className="text-sm text-accent font-bold">✅ تم نشر تقييمك، شكراً لك!</p>}

            <button type="submit" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-accent text-accent-foreground font-bold shadow-accent hover:scale-105 transition-transform">
              نشر التقييم <Send className="w-4 h-4" />
            </button>
          </form>

          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground">لا توجد تقييمات بعد — كن أول من يقيّمنا!</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {reviews.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-black">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-display font-bold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("ar-EG")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-4 h-4 ${n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-5xl mx-auto relative bg-gradient-hero rounded-[2.5rem] p-12 md:p-16 text-center overflow-hidden shadow-glow">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl font-black text-primary-foreground mb-4">
              عندك فكرة؟ <span className="text-gradient">خلّينا ننفّذها</span>
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
              تواصل معنا عبر صفحتنا على فيسبوك أو عبر البريد الإلكتروني للحصول على استشارة مجانية لمشروعك القادم.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://www.facebook.com/share/1KQTn54X1M/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 border border-white/30 text-primary-foreground font-bold backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Facebook className="w-5 h-5" /> صفحتنا على فيسبوك
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-hero flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">asswany programer</span>
          </div>
          <p>© {new Date().getFullYear()} asswany programer — جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
