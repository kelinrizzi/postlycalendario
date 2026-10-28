import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/use-session";
import { checkEmailAllowed } from "@/lib/access.functions";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no Postly — Login com e-mail ou Google" },
      {
        name: "description",
        content:
          "Acesse sua conta Postly para criar posts, carrosséis e estratégias de conteúdo com IA.",
      },
      { property: "og:title", content: "Entrar no Postly" },
      {
        property: "og:description",
        content: "Login com e-mail e senha ou com o Google para criar conteúdo com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const checkedEmailRef = useRef<string | null>(null);

  // Sessão ativa (ex.: retorno do Google): só segue para o app se o e-mail
  // estiver aprovado pelo admin; caso contrário, desconecta.
  useEffect(() => {
    if (loading || !session) return;
    const email = session.user.email ?? "";
    if (checkedEmailRef.current === email) return;
    checkedEmailRef.current = email;
    void (async () => {
      const { allowed } = await checkEmailAllowed({ data: { email } });
      if (allowed) {
        navigate({ to: "/app", replace: true });
      } else {
        await supabase.auth.signOut();
        setError(
          "Este e-mail não está autorizado. Peça ao administrador para liberar seu acesso.",
        );
      }
    })();
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { allowed } = await checkEmailAllowed({ data: { email: email.trim() } });
        if (!allowed) {
          setError(
            "Este e-mail não está autorizado. Peça ao administrador para liberar seu acesso.",
          );
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Conta criada! Confirme o e-mail que enviamos para entrar.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-ig-gradient flex items-center justify-center shadow-soft">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">
            <span className="text-ig-gradient">Postly</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Entre para criar seu conteúdo" : "Crie sua conta gratuita"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-soft p-5">
          <button
            onClick={onGoogle}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold hover:bg-secondary/60 disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.9 2.2 2.8 6.4 2.8 11.5S6.9 20.8 12 20.8c5.9 0 9.1-4.1 9.1-9 0-.6-.06-1.1-.15-1.6H12z"
              />
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">E-mail</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Senha</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                />
              </div>
            </label>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {info && <p className="text-xs text-muted-foreground">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
              className="font-semibold text-foreground hover:underline"
            >
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            Voltar ao editor
          </Link>
        </p>
      </div>
    </main>
  );
}
