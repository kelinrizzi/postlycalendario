import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function useAccess() {
  const { user, loading } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    (async () => {
      // mantém o perfil atualizado
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: (user.user_metadata?.["full_name"] as string | undefined) ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      const [{ data: adminData }, { data: allowedData }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("is_email_allowed", { _email: user.email ?? "" }),
      ]);

      if (!active) return;
      setIsAdmin(Boolean(adminData));
      setAllowed(Boolean(allowedData) || Boolean(adminData));
      setChecking(false);
    })();

    return () => {
      active = false;
    };
  }, [user, loading]);

  return { user, isAdmin, allowed, loading: loading || checking };
}
