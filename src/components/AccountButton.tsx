import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function AccountButton() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  if (loading) return <div className="w-[88px] h-9" aria-hidden />;

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/70"
      >
        <LogIn className="w-4 h-4" /> Entrar
      </Link>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/admin"
        title="Painel administrativo"
        className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/70"
      >
        <Shield className="w-3.5 h-3.5" /> Admin
      </Link>
      <div
        title={user.email ?? undefined}
        className="w-8 h-8 rounded-full bg-ig-gradient text-white text-xs font-bold flex items-center justify-center shadow-soft"
      >
        {initial}
      </div>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/login", replace: true });
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/70"
      >
        <LogOut className="w-3.5 h-3.5" /> Sair
      </button>
    </div>
  );
}
