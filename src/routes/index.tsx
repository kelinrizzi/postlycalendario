import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Wand2,
  LayoutGrid,
  CalendarDays,
  Image as ImageIcon,
  Type,
  Download,
  ArrowRight,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Postly — Crie posts e carrosséis para Instagram com IA" },
      {
        name: "description",
        content:
          "Gere posts e carrosséis para Instagram com IA. Edite textos, fontes, cores e imagens em segundos. Estratégia de conteúdo e calendário editorial inclusos.",
      },
      { property: "og:title", content: "Postly — Crie posts para Instagram com IA" },
      {
        property: "og:description",
        content:
          "Carrosséis prontos em segundos. Edição completa de texto, fonte, cor e imagem, e calendário editorial com SEO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useSession();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 bg-card/70 backdrop-blur border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ig-gradient flex items-center justify-center shadow-soft">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">
            <span className="text-ig-gradient">Postly</span>
          </span>
        </div>
        <Link
          to={user ? "/app" : "/login"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft hover:opacity-95"
        >
          {user ? "Abrir editor" : "Entrar"} <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold text-secondary-foreground mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Criação de conteúdo com IA
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Posts e carrosséis para o{" "}
          <span className="text-ig-gradient">Instagram</span> em segundos
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Descreva o post e a IA cria o criativo. Edite texto, fonte, cor e imagem,
          gere legendas com SEO e planeje 30 dias de conteúdo.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={user ? "/app" : "/login"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft hover:opacity-95"
          >
            <Wand2 className="w-4 h-4" /> {user ? "Começar a criar" : "Criar minha conta"}
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-secondary/60"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Feature
          icon={<LayoutGrid className="w-5 h-5" />}
          title="Carrosséis com IA"
          desc="Gere vários slides de uma vez com texto, título e imagem prontos para editar."
        />
        <Feature
          icon={<ImageIcon className="w-5 h-5" />}
          title="Imagens editáveis"
          desc="Crie imagens por IA, faça upload da sua ou recrie com um novo prompt."
        />
        <Feature
          icon={<Type className="w-5 h-5" />}
          title="Tipografia & cores"
          desc="8 fontes, alinhamento, cores e sobreposição para um visual coerente."
        />
        <Feature
          icon={<CalendarDays className="w-5 h-5" />}
          title="Calendário editorial"
          desc="Estratégia de 30 dias com ganchos, legendas SEO e hashtags por nicho."
        />
        <Feature
          icon={<Wand2 className="w-5 h-5" />}
          title="Onboarding estratégico"
          desc="Comece com perguntas guiadas para um briefing de conteúdo afiado."
        />
        <Feature
          icon={<Download className="w-5 h-5" />}
          title="Exportação em PNG"
          desc="Baixe todos os slides em alta resolução 1080×1080 com um clique."
        />
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <div className="max-w-2xl mx-auto rounded-3xl bg-card border border-border shadow-card p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Pronto para criar conteúdo que performa?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Entre no Postly e gere seu primeiro carrossel agora mesmo.
          </p>
          <Link
            to={user ? "/app" : "/login"}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft hover:opacity-95"
          >
            <Sparkles className="w-4 h-4" /> {user ? "Abrir editor" : "Começar grátis"}
          </Link>
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-border text-center text-xs text-muted-foreground">
        Postly — Criação de conteúdo com IA para Instagram
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-5 flex flex-col gap-2">
      <div className="w-10 h-10 rounded-xl bg-ig-gradient text-white flex items-center justify-center shadow-soft">
        {icon}
      </div>
      <h3 className="text-base font-semibold mt-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
