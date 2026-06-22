import { useRef } from "react";
import { Upload, Trash2, Check } from "lucide-react";
import { FONTS, OVERLAYS, PRESET_COLORS, type Brand } from "@/lib/slide-types";

type Props = {
  brand: Brand;
  update: (patch: Partial<Brand>) => void;
};

export function BrandKit({ brand, update }: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const onLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update({ logoUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 p-4">
      {/* LEFT — form */}
      <div className="bg-card rounded-2xl shadow-card p-6 flex flex-col gap-6 h-fit">
        <div>
          <h2 className="text-lg font-bold">Identidade da marca</h2>
          <p className="text-sm text-muted-foreground">
            Defina o branding do seu perfil. A IA segue essa linha visual para manter o feed
            consistente.
          </p>
        </div>

        {/* Follow visual line toggle */}
        <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer select-none hover:bg-secondary/40">
          <input
            type="checkbox"
            checked={brand.followVisualLine}
            onChange={(e) => update({ followVisualLine: e.target.checked })}
            className="mt-0.5 accent-[color:var(--primary)]"
          />
          <span>
            <span className="text-sm font-semibold">Seguir a linha visual</span>
            <span className="block text-xs text-muted-foreground">
              Aplica cores, fonte e logo da marca em todos os posts gerados, para o perfil não
              ficar bagunçado.
            </span>
          </span>
        </label>

        <Field label="Nome da marca / perfil">
          <input
            value={brand.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ex: Estúdio Aurora"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
        </Field>

        <Field label="@ do perfil">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <input
              value={brand.handle.replace(/^@/, "")}
              onChange={(e) => update({ handle: e.target.value })}
              placeholder="seuperfil"
              className="w-full rounded-xl border border-input bg-background pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Aplicado automaticamente nos slides quando a linha visual está ativa.
          </p>
        </Field>

        {/* Logo */}
        <Field label="Logo">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border border-border bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-muted-foreground">Sem logo</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium px-3 py-2 hover:bg-secondary"
              >
                <Upload className="w-3.5 h-3.5" /> Enviar logo
              </button>
              {brand.logoUrl && (
                <button
                  onClick={() => update({ logoUrl: null })}
                  className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onLogoUpload(f);
                e.target.value = "";
              }}
            />
          </div>
          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={brand.showLogo}
              onChange={(e) => update({ showLogo: e.target.checked })}
              className="accent-[color:var(--primary)]"
            />
            <span className="text-xs text-muted-foreground">Exibir logo nos posts</span>
          </label>
        </Field>

        {/* Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Cor principal">
            <ColorPicker value={brand.primary} onChange={(primary) => update({ primary })} />
          </Field>
          <Field label="Cor de apoio">
            <ColorPicker value={brand.secondary} onChange={(secondary) => update({ secondary })} />
          </Field>
          <Field label="Cor do texto">
            <ColorPicker value={brand.textColor} onChange={(textColor) => update({ textColor })} />
          </Field>
        </div>

        {/* Font */}
        <Field label="Fonte da marca">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {FONTS.map((f) => (
              <button
                key={f.label}
                onClick={() => update({ fontFamily: f.value })}
                style={{ fontFamily: f.value }}
                className={`text-sm px-2 py-2 rounded-lg border transition ${
                  brand.fontFamily === f.value
                    ? "border-[color:var(--primary)] bg-primary/5"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Overlay */}
        <Field label="Sobreposição padrão na imagem">
          <div className="grid grid-cols-4 gap-1.5">
            {OVERLAYS.map((o) => (
              <button
                key={o.value}
                onClick={() => update({ overlay: o.value })}
                className={`text-xs px-2 py-1.5 rounded-lg border ${
                  brand.overlay === o.value
                    ? "border-[color:var(--primary)] bg-primary/5"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-[color:var(--primary)]" /> A marca é salva
          automaticamente neste dispositivo.
        </p>
      </div>

      {/* RIGHT — live preview */}
      <aside className="h-fit lg:sticky lg:top-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Prévia
        </p>
        <div
          className="aspect-square rounded-3xl overflow-hidden shadow-soft relative flex flex-col items-center justify-center p-8 text-center"
          style={{ background: brand.primary }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                brand.overlay === "dark"
                  ? "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45))"
                  : brand.overlay === "light"
                    ? "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.5))"
                    : brand.overlay === "gradient"
                      ? `linear-gradient(135deg, ${brand.primary}99, ${brand.secondary}99)`
                      : "transparent",
            }}
          />
          <div
            className="relative z-10 font-bold leading-tight"
            style={{ color: brand.textColor, fontFamily: brand.fontFamily, fontSize: 30 }}
          >
            {brand.name || "Sua marca"}
          </div>
          <div
            className="relative z-10 mt-2 text-sm"
            style={{ color: brand.textColor, fontFamily: brand.fontFamily, opacity: 0.9 }}
          >
            Linha visual consistente ✨
          </div>
          {brand.showLogo && brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt="logo"
              className="absolute bottom-5 right-5 h-10 max-w-[40%] object-contain z-10 drop-shadow"
            />
          )}
          {brand.handle.trim() && (
            <div
              className="absolute bottom-5 left-5 z-10 font-bold text-sm"
              style={{ color: brand.textColor, fontFamily: brand.fontFamily }}
            >
              @{brand.handle.replace(/^@/, "")}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
            background: "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
        />
      </label>
    </div>
  );
}
