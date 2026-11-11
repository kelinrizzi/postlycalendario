import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2, Grid3X3, Type as TypeIcon, Palette } from "lucide-react";
import { MovableText, type TextOffsets, type TextElement, type TextOffset } from "@/components/MovableText";

const CANVAS_PX = 1080;

export type StudioLayout = "capa" | "corpo" | "destaque" | "cta";

const SERIF_FONTS = [
  { label: "Playfair", value: '"Playfair Display", serif' },
  { label: "DM Serif", value: '"DM Serif Display", serif' },
  { label: "Inter", value: '"Inter", sans-serif' },
  { label: "Poppins", value: '"Poppins", sans-serif' },
  { label: "Montserrat", value: '"Montserrat", sans-serif' },
  { label: "Space Grotesk", value: '"Space Grotesk", sans-serif' },
  { label: "Bebas Neue", value: '"Bebas Neue", sans-serif' },
  { label: "Caveat", value: '"Caveat", cursive' },
] as const;

const BG_PRESETS = ["#F4F0E7", "#FFFFFF", "#F1EDE4", "#EDEAE3", "#101010", "#12213A"];
const TEXT_PRESETS = ["#12213A", "#101010", "#2A2A2A", "#F4F0E7", "#3C3C3C", "#1B3A2F"];
const ACCENT_PRESETS = ["#E4762B", "#D4622A", "#C2410C", "#B08968", "#2F6F4E", "#4F5BD5"];

export type StudioState = {
  kicker: string;
  headline: string;
  accentLine: string;
  label: string;
  handle: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  layout: StudioLayout;
  grid: boolean;
};

export const defaultStudioState: StudioState = {
  kicker: "Todo funil que vaza",
  headline: "vaza no mesmo lugar",
  accentLine: "",
  label: "O DIAGNÓSTICO",
  handle: "seuperfil",
  bgColor: BG_PRESETS[0],
  textColor: TEXT_PRESETS[0],
  accentColor: ACCENT_PRESETS[0],
  fontFamily: SERIF_FONTS[0].value,
  layout: "capa",
  grid: true,
};

/* ---------------- Canvas (rendered by code, exported as PNG) ---------------- */

export function StudioCanvas({
  state,
  size = CANVAS_PX,
  innerRef,
  textOffsets,
  onMoveText,
}: {
  state: StudioState;
  size?: number;
  innerRef?: React.Ref<HTMLDivElement>;
  textOffsets?: TextOffsets;
  onMoveText?: (element: TextElement, offset: TextOffset) => void;
}) {
  const u = (n: number) => size * n;
  const gridLine = `color-mix(in oklab, ${state.textColor} 7%, transparent)`;
  const isDestaque = state.layout === "destaque";
  const isCorpo = state.layout === "corpo";
  const isCta = state.layout === "cta";

  const headlineSize = isDestaque ? u(0.105) : state.layout === "capa" ? u(0.072) : u(0.055);

  return (
    <div
      ref={innerRef}
      data-slide-canvas
      style={{
        width: size,
        height: size,
        position: "relative",
        background: state.bgColor,
        color: state.textColor,
        overflow: "hidden",
        fontFamily: state.fontFamily,
      }}
    >
      {/* subtle grid */}
      {state.grid && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)`,
            backgroundSize: `${u(0.0625)}px ${u(0.0625)}px`,
          }}
        />
      )}

      {/* corner brackets */}
      {(
        [
          { top: u(0.055), left: u(0.055), b: "top-left" },
          { top: u(0.055), right: u(0.055), b: "top-right" },
          { bottom: u(0.055), left: u(0.055), b: "bottom-left" },
          { bottom: u(0.055), right: u(0.055), b: "bottom-right" },
        ] as const
      ).map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: u(0.035),
            height: u(0.035),
            top: "top" in c ? c.top : undefined,
            bottom: "bottom" in c ? c.bottom : undefined,
            left: "left" in c ? c.left : undefined,
            right: "right" in c ? c.right : undefined,
            borderTop: c.b.startsWith("top") ? `2px solid ${state.accentColor}` : undefined,
            borderBottom: c.b.startsWith("bottom") ? `2px solid ${state.accentColor}` : undefined,
            borderLeft: c.b.endsWith("left") ? `2px solid ${state.accentColor}` : undefined,
            borderRight: c.b.endsWith("right") ? `2px solid ${state.accentColor}` : undefined,
            opacity: 0.75,
          }}
        />
      ))}

      {/* side ticks */}
      {[0.35, 0.5, 0.65].map((p) => (
        <div key={p}>
          <div
            style={{
              position: "absolute",
              left: u(0.045),
              top: u(p),
              width: u(0.012),
              height: 2,
              background: state.accentColor,
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: u(0.045),
              top: u(p),
              width: u(0.012),
              height: 2,
              background: state.accentColor,
              opacity: 0.6,
            }}
          />
        </div>
      ))}

      {/* top label */}
      {state.label.trim() && (
        <MovableText offset={textOffsets?.label} onMove={onMoveText ? (offset) => onMoveText("label", offset) : undefined} data-text-element="label"
          style={{
            position: "absolute",
            top: u(0.052),
            left: u(0.105),
            fontFamily: '"Inter", sans-serif',
            fontSize: u(0.017),
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: state.accentColor,
          }}
        >
          {state.label}
        </MovableText>
      )}

      {/* top-right handle mark */}
      {state.handle.trim() && (
        <div
          style={{
            position: "absolute",
            top: u(0.052),
            right: u(0.105),
            fontFamily: '"Inter", sans-serif',
            fontSize: u(0.015),
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 600,
            opacity: 0.45,
          }}
        >
          {state.handle.replace(/^@/, "").slice(0, 12)}
        </div>
      )}

      {/* content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: `0 ${u(0.14)}px`,
          textAlign: "center",
        }}
      >
        {state.kicker.trim() && (
          <MovableText offset={textOffsets?.title} onMove={onMoveText ? (offset) => onMoveText("title", offset) : undefined} data-text-element="title"
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: isCorpo ? u(0.024) : u(0.026),
              fontWeight: 600,
              lineHeight: 1.5,
              marginBottom: u(0.022),
              opacity: 0.85,
            }}
          >
            {state.kicker}
          </MovableText>
        )}

        {state.headline.trim() && (
          <MovableText offset={textOffsets?.text} onMove={onMoveText ? (offset) => onMoveText("text", offset) : undefined} data-text-element="text"
            style={{
              fontSize: headlineSize,
              lineHeight: 1.12,
              fontWeight: isDestaque ? 700 : 600,
              letterSpacing: "-0.015em",
              color: isDestaque || isCta ? state.accentColor : state.textColor,
              whiteSpace: "pre-wrap",
            }}
          >
            {state.headline}
          </MovableText>
        )}

        {state.accentLine.trim() && (
          <div
            style={{
              marginTop: u(0.028),
              fontFamily: '"Inter", sans-serif',
              fontSize: u(0.022),
              fontWeight: 600,
              lineHeight: 1.5,
              color: state.accentColor,
            }}
          >
            {state.accentLine}
          </div>
        )}
      </div>

      {/* footer handle with rules */}
      {state.handle.trim() && (
        <MovableText offset={textOffsets?.handle} onMove={onMoveText ? (offset) => onMoveText("handle", offset) : undefined} data-text-element="handle"
          style={{
            position: "absolute",
            bottom: u(0.075),
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: u(0.02),
          }}
        >
          <div style={{ width: u(0.06), height: 1, background: state.textColor, opacity: 0.25 }} />
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: u(0.018),
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            @{state.handle.replace(/^@/, "")}
          </div>
          <div style={{ width: u(0.06), height: 1, background: state.textColor, opacity: 0.25 }} />
        </MovableText>
      )}
    </div>
  );
}

/* ---------------- Preview wrapper (scales 1080 canvas to fit) ---------------- */

function StudioPreview({ state, canvasRef }: { state: StudioState; canvasRef: React.RefObject<HTMLDivElement | null> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const scaler = scalerRef.current;
    if (!container || !scaler) return;
    const update = () => {
      const s = container.clientWidth / CANVAS_PX;
      scaler.style.transform = `scale(${s})`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[560px] aspect-square rounded-3xl overflow-hidden shadow-card border border-border"
    >
      <div
        ref={scalerRef}
        style={{
          width: CANVAS_PX,
          height: CANVAS_PX,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <StudioCanvas state={state} size={CANVAS_PX} innerRef={canvasRef} />
      </div>
    </div>
  );
}

/* ---------------- Panel + page ---------------- */

function Swatches({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{ background: c }}
          className={`w-7 h-7 rounded-lg border transition ${
            value.toLowerCase() === c.toLowerCase()
              ? "border-foreground scale-110"
              : "border-border"
          }`}
          aria-label={c}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-lg border border-border bg-transparent cursor-pointer"
        aria-label="Cor personalizada"
      />
    </div>
  );
}

const fieldCls =
  "mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function StudioComposer() {
  const [state, setState] = useState<StudioState>(defaultStudioState);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const set = useCallback(
    <K extends keyof StudioState>(k: K, v: StudioState[K]) =>
      setState((s) => ({ ...s, [k]: v })),
    [],
  );

  const download = useCallback(async () => {
    const node = canvasRef.current;
    if (!node) return;
    setExporting(true);
    try {
      await document.fonts?.ready;
      const dataUrl = await toPng(node, {
        width: CANVAS_PX,
        height: CANVAS_PX,
        pixelRatio: 1,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `post-${state.layout}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }, [state.layout]);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 p-4">
      {/* Preview */}
      <div className="flex flex-col items-center justify-start gap-4">
        <StudioPreview state={state} canvasRef={canvasRef} />
        <button
          onClick={download}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Baixar PNG 1080×1080
        </button>
      </div>

      {/* Panel */}
      <aside className="bg-card rounded-2xl shadow-card p-5 flex flex-col gap-5 h-fit lg:sticky lg:top-4">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Palette className="w-4 h-4" /> Renderizador de imagem
        </div>

        <div>
          <label className={labelCls}>Layout</label>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {(["capa", "corpo", "destaque", "cta"] as StudioLayout[]).map((l) => (
              <button
                key={l}
                onClick={() => set("layout", l)}
                className={`text-[11px] font-semibold uppercase py-2 rounded-lg border transition ${
                  state.layout === l
                    ? "bg-secondary border-foreground/30"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Etiqueta</label>
          <input
            value={state.label}
            onChange={(e) => set("label", e.target.value)}
            className={fieldCls}
            placeholder="O DIAGNÓSTICO"
          />
        </div>

        <div>
          <label className={labelCls}>Linha de apoio</label>
          <textarea
            value={state.kicker}
            onChange={(e) => set("kicker", e.target.value)}
            rows={2}
            className={`${fieldCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls}>Título principal</label>
          <textarea
            value={state.headline}
            onChange={(e) => set("headline", e.target.value)}
            rows={2}
            className={`${fieldCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls}>Linha de destaque</label>
          <input
            value={state.accentLine}
            onChange={(e) => set("accentLine", e.target.value)}
            className={fieldCls}
            placeholder="opcional"
          />
        </div>

        <div>
          <label className={labelCls}>@ do perfil</label>
          <input
            value={state.handle}
            onChange={(e) => set("handle", e.target.value)}
            className={fieldCls}
            placeholder="seuperfil"
          />
        </div>

        <div>
          <label className={labelCls}>Cor do fundo</label>
          <Swatches colors={BG_PRESETS} value={state.bgColor} onChange={(c) => set("bgColor", c)} />
        </div>

        <div>
          <label className={labelCls}>Cor do texto principal</label>
          <Swatches
            colors={TEXT_PRESETS}
            value={state.textColor}
            onChange={(c) => set("textColor", c)}
          />
        </div>

        <div>
          <label className={labelCls}>Cor de destaque</label>
          <Swatches
            colors={ACCENT_PRESETS}
            value={state.accentColor}
            onChange={(c) => set("accentColor", c)}
          />
        </div>

        <div>
          <label className={labelCls}>
            <TypeIcon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Fonte
          </label>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {SERIF_FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => set("fontFamily", f.value)}
                style={{ fontFamily: f.value }}
                className={`text-sm py-2 rounded-lg border transition ${
                  state.fontFamily === f.value
                    ? "bg-secondary border-foreground/30"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => set("grid", !state.grid)}
          className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition ${
            state.grid ? "bg-secondary border-foreground/30" : "border-border text-muted-foreground"
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" /> Grade sutil de fundo
        </button>
      </aside>
    </div>
  );
}
