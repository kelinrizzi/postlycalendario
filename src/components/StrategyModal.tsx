import { useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X } from "lucide-react";

export type StrategyAnswers = {
  niche: string;
  audience: string;
  goal: string;
  tone: string;
  format: string;
  topic: string;
};

const GOALS = [
  "Atrair seguidores",
  "Educar / ensinar",
  "Gerar autoridade",
  "Vender produto/serviço",
  "Engajamento e salvamentos",
  "Gerar leads",
];
const TONES = [
  "Inspirador",
  "Direto e objetivo",
  "Divertido / descontraído",
  "Profissional",
  "Provocativo / polêmico",
  "Acolhedor / empático",
];
const FORMATS = [
  { label: "Carrossel educativo", value: "carousel-educational" },
  { label: "Dicas rápidas (lista)", value: "tips-list" },
  { label: "Storytelling", value: "storytelling" },
  { label: "Passo a passo", value: "step-by-step" },
  { label: "Mitos e verdades", value: "myths" },
  { label: "Antes vs Depois", value: "before-after" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onFinish: (answers: StrategyAnswers, brief: string) => void;
};

export function StrategyModal({ open, onClose, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<StrategyAnswers>({
    niche: "",
    audience: "",
    goal: "",
    tone: "",
    format: "",
    topic: "",
  });

  if (!open) return null;

  const steps = [
    {
      title: "Qual é o seu nicho?",
      subtitle: "Nos conte a área ou tema principal do seu perfil.",
      render: (
        <input
          autoFocus
          value={a.niche}
          onChange={(e) => setA({ ...a, niche: e.target.value })}
          placeholder="Ex: marketing digital, nutrição esportiva, moda feminina..."
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-ring/50 outline-none"
        />
      ),
      valid: a.niche.trim().length > 1,
    },
    {
      title: "Para quem você fala?",
      subtitle: "Descreva o público-alvo em uma frase.",
      render: (
        <input
          autoFocus
          value={a.audience}
          onChange={(e) => setA({ ...a, audience: e.target.value })}
          placeholder="Ex: mulheres de 25 a 40 que querem empreender online"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-ring/50 outline-none"
        />
      ),
      valid: a.audience.trim().length > 3,
    },
    {
      title: "Qual é o objetivo do post?",
      subtitle: "Isso guia a IA no gancho e na chamada para ação.",
      render: (
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setA({ ...a, goal: g })}
              className={`text-left text-sm rounded-xl px-3 py-3 border transition ${
                a.goal === g
                  ? "border-transparent bg-ig-gradient text-white shadow-soft"
                  : "border-input hover:border-foreground/30"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ),
      valid: !!a.goal,
    },
    {
      title: "Qual tom de voz?",
      subtitle: "Como você quer soar para o seu público.",
      render: (
        <div className="grid grid-cols-2 gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => setA({ ...a, tone: t })}
              className={`text-left text-sm rounded-xl px-3 py-3 border transition ${
                a.tone === t
                  ? "border-transparent bg-ig-gradient text-white shadow-soft"
                  : "border-input hover:border-foreground/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      ),
      valid: !!a.tone,
    },
    {
      title: "Qual formato de conteúdo?",
      subtitle: "Escolha a estrutura ideal para esse post.",
      render: (
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setA({ ...a, format: f.label })}
              className={`text-left text-sm rounded-xl px-3 py-3 border transition ${
                a.format === f.label
                  ? "border-transparent bg-ig-gradient text-white shadow-soft"
                  : "border-input hover:border-foreground/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      ),
      valid: !!a.format,
    },
    {
      title: "Sobre o que é esse post específico?",
      subtitle: "Descreva o tema/ângulo do carrossel que vamos criar agora.",
      render: (
        <textarea
          autoFocus
          rows={4}
          value={a.topic}
          onChange={(e) => setA({ ...a, topic: e.target.value })}
          placeholder="Ex: 5 erros que travam o crescimento no Instagram em 2026"
          className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-ring/50 outline-none"
        />
      ),
      valid: a.topic.trim().length > 4,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const finish = () => {
    const brief = `Tema: ${a.topic}
Nicho: ${a.niche}
Público-alvo: ${a.audience}
Objetivo: ${a.goal}
Tom de voz: ${a.tone}
Formato: ${a.format}`;
    onFinish(a, brief);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-ig-gradient flex items-center justify-center shadow-soft">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Estratégia do post · {step + 1}/{steps.length}
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mt-3 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition ${
                i <= step ? "bg-ig-gradient" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold leading-tight">{current.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">{current.subtitle}</p>

        <div className="mb-6">{current.render}</div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          {isLast ? (
            <button
              onClick={finish}
              disabled={!current.valid}
              className="inline-flex items-center gap-2 rounded-xl bg-ig-gradient text-white px-5 py-2.5 text-sm font-semibold shadow-soft disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> Criar meu post
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={!current.valid}
              className="inline-flex items-center gap-2 rounded-xl bg-ig-gradient text-white px-5 py-2.5 text-sm font-semibold shadow-soft disabled:opacity-50"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
