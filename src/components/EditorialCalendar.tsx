import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  Loader2,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Download,
  Clock,
  Hash,
  Target,
  Save,
  RefreshCw,
} from "lucide-react";
import { generateStrategy, type CalendarPost } from "@/lib/ai.functions";

const FORMAT_STYLES: Record<CalendarPost["format"], string> = {
  Reels: "bg-pink-100 text-pink-700 border-pink-200",
  Carrossel: "bg-violet-100 text-violet-700 border-violet-200",
  Post: "bg-amber-100 text-amber-700 border-amber-200",
  Story: "bg-sky-100 text-sky-700 border-sky-200",
};

const STORAGE_KEY = "editorial-calendar-v1";

type PersistedCalendar = {
  niche: string;
  audience: string;
  goal: string;
  startDate: string;
  strategy: string;
  pillars: string[];
  posts: CalendarPost[];
  savedAt: string;
};

export function EditorialCalendar() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Load persisted state synchronously (client only)
  const initial = useMemo<PersistedCalendar | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedCalendar) : null;
    } catch {
      return null;
    }
  }, []);

  const [niche, setNiche] = useState(initial?.niche ?? "");
  const [audience, setAudience] = useState(initial?.audience ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string>(initial?.strategy ?? "");
  const [pillars, setPillars] = useState<string[]>(initial?.pillars ?? []);
  const [posts, setPosts] = useState<CalendarPost[]>(initial?.posts ?? []);
  const [selected, setSelected] = useState<CalendarPost | null>(
    initial?.posts?.[0] ?? null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<"all" | CalendarPost["format"]>("all");
  const [savedAt, setSavedAt] = useState<string | null>(initial?.savedAt ?? null);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const call = useServerFn(generateStrategy);

  const persist = (data: Partial<PersistedCalendar> = {}) => {
    if (typeof window === "undefined") return;
    const payload: PersistedCalendar = {
      niche,
      audience,
      goal,
      startDate,
      strategy,
      pillars,
      posts,
      savedAt: new Date().toISOString(),
      ...data,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedAt(payload.savedAt);
    } catch {
      /* ignore quota */
    }
  };

  const onSave = () => {
    if (!posts.length) return;
    persist();
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  };

  const onGenerate = async () => {
    if (!niche.trim()) return;
    if (
      posts.length > 0 &&
      !window.confirm(
        "Isso vai substituir o calendário atual salvo. Deseja continuar?",
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await call({ data: { niche, audience, goal, startDate } });
      setStrategy(res.strategy);
      setPillars(res.pillars);
      setPosts(res.posts);
      setSelected(res.posts[0] ?? null);
      persist({
        strategy: res.strategy,
        pillars: res.pillars,
        posts: res.posts,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar calendário");
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = async (p: CalendarPost) => {
    const text = `${p.caption}\n\n${p.cta}\n\n${p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(`${p.day}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportCSV = () => {
    if (!posts.length) return;
    const header = ["Dia", "Data", "Formato", "Pilar", "Tema", "Gancho", "Legenda", "CTA", "Hashtags", "Horário"];
    const rows = posts.map((p) => [
      p.day,
      p.date,
      p.format,
      p.pillar,
      p.title,
      p.hook,
      p.caption,
      p.cta,
      p.hashtags.join(" "),
      p.bestTime,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendario-editorial.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = posts.filter((p) => formatFilter === "all" || p.format === formatFilter);

  // Build month grid: align first post day-of-week
  const firstDate = posts[0] ? new Date(posts[0].date) : null;
  const leadingBlanks = firstDate ? firstDate.getDay() : 0;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 p-4">
      {/* LEFT — strategy form */}
      <aside className="bg-card rounded-2xl shadow-card p-5 flex flex-col gap-4 h-fit lg:sticky lg:top-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ig-gradient flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Estratégia 30 dias</h2>
            <p className="text-[11px] text-muted-foreground -mt-0.5">
              IA monta o plano completo
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Nicho / Marca
          </label>
          <textarea
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            rows={2}
            placeholder="Ex: Confeitaria artesanal especializada em bolos vegan"
            className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Público-alvo
          </label>
          <textarea
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            rows={2}
            placeholder="Mulheres 25-45, interessadas em alimentação saudável"
            className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Objetivo
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            placeholder="Aumentar vendas online e ganhar seguidores"
            className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <button
          onClick={onGenerate}
          disabled={loading || !niche.trim()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ig-gradient text-white px-4 py-3 font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Planejando...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" /> Gerar calendário
            </>
          )}
        </button>

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {posts.length > 0 && (
          <button
            onClick={exportCSV}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-3 py-2 text-sm font-medium hover:bg-secondary/70"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        )}
      </aside>

      {/* RIGHT — calendar view */}
      <main className="flex flex-col gap-4 min-w-0">
        {posts.length === 0 && !loading && (
          <div className="bg-card rounded-2xl shadow-card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-ig-gradient flex items-center justify-center mb-4 shadow-soft">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg">Seu calendário editorial</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Preencha as informações da sua marca e a IA criará uma estratégia
              completa de 30 dias com formatos, ganchos, legendas e hashtags.
            </p>
          </div>
        )}

        {loading && (
          <div className="bg-card rounded-2xl shadow-card p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[color:var(--primary)]" />
            <p className="text-sm text-muted-foreground mt-3">
              Construindo sua estratégia de 30 dias...
            </p>
          </div>
        )}

        {posts.length > 0 && (
          <>
            {/* Strategy summary */}
            <div className="bg-card rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[color:var(--primary)]" />
                <h3 className="font-bold text-sm">Estratégia</h3>
              </div>
              <p className="text-sm text-foreground/90 mb-3">{strategy}</p>
              {pillars.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pillars.map((p) => (
                    <span
                      key={p}
                      className="text-[11px] font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "Reels", "Carrossel", "Post", "Story"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormatFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    formatFilter === f
                      ? "border-[color:var(--primary)] bg-primary/5 font-semibold"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {f === "all" ? `Todos (${posts.length})` : f}
                </button>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="bg-card rounded-2xl shadow-card p-4">
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div
                    key={d}
                    className="text-[11px] font-semibold text-center text-muted-foreground uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} className="aspect-square" />
                ))}
                {posts.map((p) => {
                  const dim =
                    formatFilter !== "all" && p.format !== formatFilter;
                  const isSel = selected?.day === p.day;
                  return (
                    <button
                      key={p.day}
                      onClick={() => setSelected(p)}
                      className={`aspect-square rounded-lg border p-1.5 text-left flex flex-col justify-between transition hover:shadow-soft ${
                        isSel
                          ? "border-[color:var(--primary)] ring-2 ring-primary/30"
                          : "border-border"
                      } ${dim ? "opacity-30" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {p.day}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-semibold px-1 py-0.5 rounded border text-center truncate ${FORMAT_STYLES[p.format]}`}
                      >
                        {p.format}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected post detail */}
            {selected && (
              <div className="bg-card rounded-2xl shadow-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary">
                        Dia {selected.day} · {selected.date}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${FORMAT_STYLES[selected.format]}`}
                      >
                        {selected.format}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary">
                        {selected.pillar}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {selected.bestTime}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mt-2">{selected.title}</h3>
                  </div>
                  <button
                    onClick={() => copyCaption(selected)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-ig-gradient text-white text-xs font-semibold px-3 py-2 hover:opacity-95"
                  >
                    {copiedId === `${selected.day}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar legenda
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                      Gancho
                    </p>
                    <p className="text-sm font-medium italic">"{selected.hook}"</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                      Legenda
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selected.caption}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                      CTA
                    </p>
                    <p className="text-sm font-medium">{selected.cta}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Hashtags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selected.hashtags.map((h) => (
                        <span
                          key={h}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                        >
                          {h.startsWith("#") ? h : `#${h}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List view for filtered */}
            <div className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="font-bold text-sm mb-3 px-1">Próximos posts</h3>
              <div className="space-y-1.5">
                {filtered.slice(0, 10).map((p) => (
                  <button
                    key={p.day}
                    onClick={() => setSelected(p)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition hover:bg-secondary ${
                      selected?.day === p.day ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] text-muted-foreground leading-none">
                        DIA
                      </span>
                      <span className="text-sm font-bold leading-none">{p.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${FORMAT_STYLES[p.format]}`}
                        >
                          {p.format}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {p.pillar} · {p.bestTime}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{p.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
