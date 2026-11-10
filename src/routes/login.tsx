import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { useSession } from "@/hooks/use-session";
import { checkEmailAllowed } from "@/lib/access.functions";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no Postly — Acesso por e-mail autorizado" },
      {
        name: "description",
        content:
          "Acesse sua conta Postly para criar posts, carrosséis e estratégias de conteúdo com IA.",
      },
      { property: "og:title", content: "Entrar no Postly" },
      {
        property: "og:description",
        content: "Acesso com e-mail autorizado e senha para criar conteúdo com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const checkAllowed = useServerFn(checkEmailAllowed);
  const { session, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const checkedEmailRef = useRef<string | null>(null);

  // Sessão ativa: só segue para o app se o e-mail
  // estiver aprovado pelo admin; caso contrário, desconecta.
  useEffect(() => {
    if (loading || !session) return;
    const email = session.user.email ?? "";
    if (checkedEmailRef.current === email) return;
    checkedEmailRef.current = email;
    void (async () => {
      const { allowed } = await checkAllowed({ data: { email } });
      if (allowed) {
        navigate({ to: "/app", replace: true });
      } else {
        await supabase.auth.signOut();
        setError(
          "Este e-mail não está autorizado. Peça ao administrador para liberar seu acesso.",
        );
      }
    })();
  }, [loading, session, navigate, checkAllowed]);

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
        const { allowed } = await checkAllowed({ data: { email: email.trim() } });
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
        const { allowed } = await checkAllowed({ data: { email: email.trim() } });
        if (!allowed) {
          setError(
            "Este e-mail não está autorizado. Peça ao administrador para liberar seu acesso.",
          );
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
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
            {mode === "signin" ? "Entre para criar seu conteúdo" : "Crie sua conta autorizada"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-soft p-5">
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

            <Button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-primary-foreground text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <Button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
              className="font-semibold text-foreground hover:underline"
            >
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </Button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Suporte: <a href="mailto:kelin.rrizzi@gmail.com" className="text-primary underline break-all">kelin.rrizzi@gmail.com</a>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            Voltar ao editor
          </Link>
        </p>
      </div>
    </main>
  );
}
