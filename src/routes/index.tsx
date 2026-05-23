import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Upload,
  Download,
  Plus,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  Type,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SlideCanvas } from "@/components/SlideCanvas";
import {
  FONTS,
  OVERLAYS,
  PRESET_COLORS,
  blankSlide,
  type Slide,
} from "@/lib/slide-types";
import { editImage, generateCarousel, generateImage } from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Postly — Crie posts e carrosséis com IA para Instagram" },
      {
        name: "description",
        content:
          "Gere posts e carrosséis para Instagram com IA. Edite textos, fontes, cores e imagens em segundos.",
      },
      { property: "og:title", content: "Postly — Crie posts para Instagram com IA" },
      {
        property: "og:description",
        content: "Carrosséis prontos em segundos. Edição completa, exportação em PNG.",
      },
    ],
  }),
  component: Editor,
});

const CANVAS_PX = 1080;

function Editor() {
  const [prompt, setPrompt] = useState("");
  const [slideCount, setSlideCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [genImageId, setGenImageId] = useState<string | null>(null);
  const [editImagePrompt, setEditImagePrompt] = useState("");
  const [slides, setSlides] = useState<Slide[]>([blankSlide("Bem-vindo ao Postly ✨")]);
  const [activeId, setActiveId] = useState(slides[0].id);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const callGenerate = useServerFn(generateCarousel);
  const callGenImage = useServerFn(generateImage);
  const callEditImage = useServerFn(editImage);

  const active = useMemo(
    () => slides.find((s) => s.id === activeId) ?? slides[0],
    [slides, activeId],
  );

  const update = (patch: Partial<Slide>) =>
    setSlides((prev) => prev.map((s) => (s.id === active.id ? { ...s, ...patch } : s)));

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const { slides: aiSlides } = await callGenerate({
        data: { prompt, slideCount },
      });
      // Build placeholders quickly so user sees structure
      const newSlides: Slide[] = aiSlides.map((s) => ({
        ...blankSlide(s.text, s.title),
        imagePrompt: s.imagePrompt,
      }));
      setSlides(newSlides);
      setActiveId(newSlides[0].id);

      // Generate images in parallel
      const results = await Promise.allSettled(
        newSlides.map((s) => callGenImage({ data: { prompt: s.imagePrompt } })),
      );
      setSlides((prev) =>
        prev.map((slide, i) => {
          const r = results[i];
          if (r && r.status === "fulfilled") return { ...slide, imageUrl: r.value.imageUrl };
          return slide;
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar conteúdo");
    } finally {
      setGenerating(false);
    }
  };

  const regenImage = async () => {
    if (!active) return;
    setGenImageId(active.id);
    setError(null);
    try {
      const promptToUse = editImagePrompt.trim() || active.imagePrompt || active.text;
      const { imageUrl } = await callGenImage({ data: { prompt: promptToUse } });
      setSlides((prev) =>
        prev.map((s) => (s.id === active.id ? { ...s, imageUrl, imagePrompt: promptToUse } : s)),
      );
      setEditImagePrompt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar imagem");
    } finally {
      setGenImageId(null);
    }
  };

  const remixImage = async () => {
    if (!active?.imageUrl || !editImagePrompt.trim()) return;
    setGenImageId(active.id);
    setError(null);
    try {
      const { imageUrl } = await callEditImage({
        data: { prompt: editImagePrompt, imageUrl: active.imageUrl },
      });
      setSlides((prev) => prev.map((s) => (s.id === active.id ? { ...s, imageUrl } : s)));
      setEditImagePrompt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao editar imagem");
    } finally {
      setGenImageId(null);
    }
  };

  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update({ imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const addSlide = () => {
    const s = blankSlide("Novo slide");
    setSlides((prev) => [...prev, s]);
    setActiveId(s.id);
  };

  const duplicateSlide = () => {
    if (!active) return;
    const copy = { ...active, id: Math.random().toString(36).slice(2, 10) };
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === active.id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setActiveId(copy.id);
  };

  const removeSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prev) => {
      const next = prev.filter((s) => s.id !== active.id);
      setActiveId(next[0].id);
      return next;
    });
  };

  const exportAll = useCallback(async () => {
    setExporting(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        const el = canvasRefs.current[slides[i].id];
        if (!el) continue;
        const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 1 });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `post-${i + 1}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      setExporting(false);
    }
  }, [slides]);

  const activeIndex = slides.findIndex((s) => s.id === active.id);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden full-size canvases for export */}
      <div style={{ position: "fixed", left: -99999, top: 0 }} aria-hidden>
        {slides.map((s) => (
          <SlideCanvas
            key={s.id}
            slide={s}
            size={CANVAS_PX}
            ref={(el) => {
              canvasRefs.current[s.id] = el;
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ig-gradient flex items-center justify-center shadow-soft">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              <span className="text-ig-gradient">Postly</span>
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5">
              Posts & carrosséis com IA
            </p>
          </div>
        </div>
        <button
          onClick={exportAll}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar {slides.length > 1 ? `${slides.length} slides` : "PNG"}
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-4 p-4">
        {/* LEFT — generation */}
        <aside className="bg-card rounded-2xl shadow-card p-5 flex flex-col gap-4 h-fit lg:sticky lg:top-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sobre o que é o post?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: 5 dicas para crescer no Instagram em 2026"
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quantos slides? <span className="text-foreground">{slideCount}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="mt-2 w-full accent-[color:var(--primary)]"
            />
          </div>
          <button
            onClick={onGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ig-gradient text-white px-4 py-3 font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> Gerar com IA
              </>
            )}
          </button>
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Slides
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={addSlide}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium px-2 py-2 hover:bg-secondary/70"
              >
                <Plus className="w-3.5 h-3.5" /> Novo
              </button>
              <button
                onClick={duplicateSlide}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium px-2 py-2 hover:bg-secondary/70"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicar
              </button>
              <button
                onClick={removeSlide}
                disabled={slides.length <= 1}
                className="inline-flex items-center justify-center rounded-lg bg-secondary text-destructive text-xs px-2 py-2 hover:bg-destructive/10 disabled:opacity-40"
                aria-label="Remover slide"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER — preview */}
        <main className="flex flex-col items-center justify-start gap-4">
          <PreviewFrame slide={active} loading={genImageId === active.id} />


          {/* Carousel strip */}
          <div className="w-full max-w-[540px] flex items-center gap-2">
            <button
              onClick={() => activeIndex > 0 && setActiveId(slides[activeIndex - 1].id)}
              disabled={activeIndex <= 0}
              className="p-2 rounded-lg bg-card shadow-card disabled:opacity-40"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 flex gap-2 overflow-x-auto py-1">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                    s.id === active.id
                      ? "border-[color:var(--primary)] shadow-soft"
                      : "border-transparent"
                  }`}
                  style={{ background: s.imageUrl ? "#000" : s.bgColor }}
                >
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt="" className="w-full h-full object-cover opacity-80" />
                  )}
                  <span className="absolute top-0.5 left-1 text-[10px] font-bold text-white drop-shadow">
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                activeIndex < slides.length - 1 && setActiveId(slides[activeIndex + 1].id)
              }
              disabled={activeIndex >= slides.length - 1}
              className="p-2 rounded-lg bg-card shadow-card disabled:opacity-40"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* RIGHT — edit panel */}
        <aside className="bg-card rounded-2xl shadow-card p-5 flex flex-col gap-5 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <Section title="Título" icon={<Type className="w-3.5 h-3.5" />}>
            <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={active.showTitle}
                onChange={(e) => update({ showTitle: e.target.checked })}
                className="accent-[color:var(--primary)]"
              />
              <span className="text-xs text-muted-foreground">
                Incluir título no slide
              </span>
            </label>
            {active.showTitle && (
              <>
                <textarea
                  value={active.title}
                  onChange={(e) => update({ title: e.target.value })}
                  rows={2}
                  placeholder="Digite o título..."
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-ring/50"
                />
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-muted-foreground">Tamanho</label>
                  <input
                    type="range"
                    min={32}
                    max={160}
                    value={active.titleSize}
                    onChange={(e) => update({ titleSize: Number(e.target.value) })}
                    className="flex-1 accent-[color:var(--primary)]"
                  />
                  <span className="text-xs tabular-nums w-8 text-right">{active.titleSize}</span>
                </div>
              </>
            )}
          </Section>

          <Section title="Texto">
            <textarea
              value={active.text}
              onChange={(e) => update({ text: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-muted-foreground">Tamanho</label>
              <input
                type="range"
                min={20}
                max={120}
                value={active.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="flex-1 accent-[color:var(--primary)]"
              />
              <span className="text-xs tabular-nums w-8 text-right">{active.fontSize}</span>
            </div>
          </Section>


          <Section title="Fonte">
            <div className="grid grid-cols-2 gap-1.5">
              {FONTS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => update({ fontFamily: f.value })}
                  style={{ fontFamily: f.value }}
                  className={`text-sm px-2 py-2 rounded-lg border transition ${
                    active.fontFamily === f.value
                      ? "border-[color:var(--primary)] bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Alinhamento">
            <div className="flex gap-1.5">
              {(
                [
                  { v: "left", icon: <AlignLeft className="w-4 h-4" /> },
                  { v: "center", icon: <AlignCenter className="w-4 h-4" /> },
                  { v: "right", icon: <AlignRight className="w-4 h-4" /> },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  onClick={() => update({ align: o.v })}
                  className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${
                    active.align === o.v
                      ? "border-[color:var(--primary)] bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {o.icon}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {(
                [
                  { v: "top", icon: <ArrowUp className="w-4 h-4" />, label: "Topo" },
                  { v: "middle", icon: null, label: "Meio" },
                  { v: "bottom", icon: <ArrowDown className="w-4 h-4" />, label: "Base" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  onClick={() => update({ vpos: o.v })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1 ${
                    active.vpos === o.v
                      ? "border-[color:var(--primary)] bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Cor do texto">
            <ColorRow
              value={active.textColor}
              onChange={(textColor) => update({ textColor })}
            />
          </Section>

          <Section title="Cor de fundo">
            <ColorRow value={active.bgColor} onChange={(bgColor) => update({ bgColor })} />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Usado quando não há imagem.
            </p>
          </Section>

          <Section title="Sobreposição na imagem">
            <div className="grid grid-cols-2 gap-1.5">
              {OVERLAYS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => update({ overlay: o.value })}
                  className={`text-xs px-2 py-1.5 rounded-lg border ${
                    active.overlay === o.value
                      ? "border-[color:var(--primary)] bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Imagem" icon={<ImageIcon className="w-3.5 h-3.5" />}>
            <textarea
              value={editImagePrompt}
              onChange={(e) => setEditImagePrompt(e.target.value)}
              placeholder="Descreva a imagem ou ajuste (ex: deixar com luz dourada)"
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <button
                onClick={regenImage}
                disabled={genImageId === active.id}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ig-gradient text-white text-xs font-semibold px-2 py-2 hover:opacity-95 disabled:opacity-60"
              >
                {genImageId === active.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                Gerar nova
              </button>
              <button
                onClick={remixImage}
                disabled={!active.imageUrl || !editImagePrompt.trim() || genImageId === active.id}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium px-2 py-2 hover:bg-secondary/70 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Editar atual
              </button>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium px-2 py-2 hover:bg-secondary"
            >
              <Upload className="w-3.5 h-3.5" /> Fazer upload de imagem
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            {active.imageUrl && (
              <button
                onClick={() => update({ imageUrl: null })}
                className="mt-1.5 w-full text-xs text-destructive hover:underline"
              >
                Remover imagem
              </button>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function ColorRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full border-2 transition ${
            value.toLowerCase() === c.toLowerCase()
              ? "border-[color:var(--primary)] scale-110"
              : "border-border"
          }`}
          style={{ background: c }}
          aria-label={c}
        />
      ))}
      <label className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-border cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
        <div
          className="w-full h-full"
          style={{
            background:
              "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
        />
      </label>
    </div>
  );
}

function PreviewFrame({ slide, loading }: { slide: Slide; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;
    const update = () => {
      const w = container.clientWidth;
      const scale = w / CANVAS_PX;
      inner.style.transform = `scale(${scale})`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[540px] aspect-square rounded-3xl overflow-hidden shadow-soft bg-white"
    >
      <div
        ref={innerRef}
        style={{
          width: CANVAS_PX,
          height: CANVAS_PX,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <SlideCanvas slide={slide} size={CANVAS_PX} />
      </div>
      {loading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium z-10">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Gerando imagem...
        </div>
      )}
    </div>
  );
}

