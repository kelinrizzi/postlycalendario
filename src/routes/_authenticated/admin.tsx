import { useEffect, useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-access";
import { claimFirstAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo | Postly" },
      {
        name: "description",
        content:
          "Gerencie quem pode acessar o Postly: convide e-mails, aprove, bloqueie e acompanhe os perfis cadastrados.",
      },
      { property: "og:title", content: "Painel administrativo | Postly" },
      {
        property: "og:description",
        content: "Convide, aprove e bloqueie o acesso de usuários ao Postly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Status = "pending" | "approved" | "blocked";

type Invite = {
  id: string;
  email: string;
  status: Status;
  notes: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  last_seen_at: string | null;
  created_at: string;
};

const statusMeta: Record<Status, { label: string; className: string; icon: typeof Clock }> = {
  approved: {
    label: "Aprovado",
    className: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700", icon: Clock },
  blocked: { label: "Bloqueado", className: "bg-rose-100 text-rose-700", icon: Ban },
};

function AdminPage() {
  const { user, isAdmin, loading } = useAccess();
  const [claiming, setClaiming] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [inviteRes, profileRes] = await Promise.all([
      supabase
        .from("allowed_emails")
        .select("id, email, status, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, email, full_name, last_seen_at, created_at")
        .order("created_at", { ascending: false }),
    ]);
    setInvites((inviteRes.data as Invite[]) ?? []);
    setProfiles((profileRes.data as Profile[]) ?? []);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  async function addInvite(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    setBusy(true);
    const { error } = await supabase.from("allowed_emails").upsert(
      { email: value, notes: notes.trim() || null, status: "approved", invited_by: user?.id },
      { onConflict: "email" },
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    setEmail("");
    setNotes("");
    toast.success("Acesso liberado para " + value);
    void load();
  }

  async function setStatus(id: string, status: Status) {
    const { error } = await supabase.from("allowed_emails").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("allowed_emails").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-soft">
          <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold mt-4">Área restrita</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sua conta não tem permissão de administrador. Se você é o dono do app e ainda não há
            nenhum administrador, você pode assumir o controle agora.
          </p>
          <button
            onClick={async () => {
              setClaiming(true);
              try {
                const res = await claimFirstAdmin();
                if (res.granted) {
                  toast.success("Você agora é administrador.");
                  window.location.reload();
                } else {
                  toast.error("Já existe um administrador neste app.");
                }
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Falha ao assumir controle");
              } finally {
                setClaiming(false);
              }
            }}
            disabled={claiming}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft disabled:opacity-60"
          >
            {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Tornar-me administrador
          </button>
          <Link
            to="/app"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ig-gradient flex items-center justify-center shadow-soft">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Painel administrativo</h1>
            <p className="text-xs text-muted-foreground -mt-0.5">
              Controle quem pode entrar no app
            </p>
          </div>
        </div>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/70"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao app
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Convidar e-mail
          </h2>
          <form onSubmit={addInvite} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pessoa@empresa.com"
              className="flex-1 px-3 py-2.5 rounded-xl bg-secondary/60 border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observação (opcional)"
              className="flex-1 px-3 py-2.5 rounded-xl bg-secondary/60 border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ig-gradient text-white text-sm font-semibold shadow-soft disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Liberar acesso
            </button>
          </form>
        </section>

        <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground px-6 pt-6">
            E-mails cadastrados ({invites.length})
          </h2>
          <ul className="mt-4 divide-y divide-border">
            {invites.length === 0 && (
              <li className="px-6 py-8 text-sm text-muted-foreground">
                Nenhum e-mail cadastrado ainda.
              </li>
            )}
            {invites.map((inv) => {
              const meta = statusMeta[inv.status];
              const Icon = meta.icon;
              return (
                <li
                  key={inv.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{inv.email}</p>
                    {inv.notes && (
                      <p className="text-xs text-muted-foreground truncate">{inv.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.className}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {meta.label}
                    </span>
                    <select
                      value={inv.status}
                      onChange={(e) => setStatus(inv.id, e.target.value as Status)}
                      className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-secondary/60 border border-border outline-none"
                    >
                      <option value="approved">Aprovado</option>
                      <option value="pending">Pendente</option>
                      <option value="blocked">Bloqueado</option>
                    </select>
                    <button
                      onClick={() => remove(inv.id)}
                      aria-label={`Remover ${inv.email}`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary/60"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground px-6 pt-6">
            Perfis que já entraram ({profiles.length})
          </h2>
          <ul className="mt-4 divide-y divide-border">
            {profiles.length === 0 && (
              <li className="px-6 py-8 text-sm text-muted-foreground">Nenhum acesso ainda.</li>
            )}
            {profiles.map((p) => (
              <li key={p.id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.full_name || p.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {p.last_seen_at
                    ? new Date(p.last_seen_at).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
