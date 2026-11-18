import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, Mail, Sparkles } from "lucide-react";
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
        content: "Acesso com e-mail autorizado para criar conteúdo com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

type Mode = "email" | "choose" | "password" | "sent";

function LoginPage() {
  const navigate = useNavigate();
  const checkAllowed = useServerFn(checkEmailAllowed);
  const { session, loading } = useSession();
  const [mode, setMode] = useState<Mode>("email");
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

  async function onCheckEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const clean = email.trim().toLowerCase();
      const { allowed } = await checkAllowed({ data: { email: clean } });
      if (!allowed) {
        setError("Este e-mail não está autorizado. Peça ao administrador para liberar seu acesso.");
        return;
      }
      setEmail(clean);
      setMode("choose");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }

  async function onSendLink() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/login`, shouldCreateUser: true },
      });
      if (error) throw error;
      setMode("sent");
      setInfo("Enviamos um link de acesso para o seu e-mail. Abra o e-mail e clique no link para entrar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o link.");
    } finally {
      setBusy(false);
    }
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          "Senha incorreta ou esta conta ainda não tem senha. Use o link de acesso por e-mail.",
        );
        return;
      }
      navigate({ to: "/app", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  const emailField = (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">E-mail</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={mode !== "email"}
          placeholder="voce@email.com"
          className="flex-1 bg-transparent py-2.5 text-sm outline-none"
        />
      </div>
    </label>
  );

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
            Entre com seu e-mail autorizado
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-soft p-5">
          {mode === "email" && (
            <form onSubmit={onCheckEmail} className="space-y-3">
              {emailField}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-primary-foreground text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Continuar
              </Button>
            </form>
          )}

          {mode === "choose" && (
            <div className="space-y-3">
              {emailField}
              <p className="text-xs text-muted-foreground">
                E-mail autorizado! Como você quer entrar?
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                type="button"
                onClick={() => { setError(null); setMode("password"); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-primary-foreground text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
              >
                <Lock className="w-4 h-4" /> Já tenho conta — Entrar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSendLink}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Receber link de acesso por e-mail
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setMode("email"); setError(null); setInfo(null); }}
                  className="font-semibold text-foreground hover:underline"
                >
                  Usar outro e-mail
                </button>
              </p>
            </div>
          )}

          {mode === "password" && (
            <form onSubmit={onSignIn} className="space-y-3">
              {emailField}
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Senha</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                  />
                </div>
              </label>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-primary-foreground text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Entrar
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={onSendLink}
                  disabled={busy}
                  className="font-semibold text-foreground hover:underline"
                >
                  Prefiro receber o link de acesso
                </button>
              </p>
            </form>
          )}

          {mode === "sent" && (
            <div className="space-y-3">
              {emailField}
              {info && <p className="text-xs text-muted-foreground">{info}</p>}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                type="button"
                onClick={onSendLink}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-primary-foreground text-sm font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Reenviar link
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setMode("email"); setError(null); setInfo(null); }}
                  className="font-semibold text-foreground hover:underline"
                >
                  Usar outro e-mail
                </button>
              </p>
            </div>
          )}
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
