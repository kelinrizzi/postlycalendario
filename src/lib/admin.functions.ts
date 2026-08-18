import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Torna o usuário atual administrador — apenas quando ainda NÃO existe
 * nenhum administrador no projeto (bootstrap do primeiro acesso).
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) return { granted: false as const };

    const email = (context.claims["email"] as string | undefined) ?? "";

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);

    if (email) {
      await supabaseAdmin
        .from("allowed_emails")
        .upsert({ email, status: "approved", invited_by: context.userId }, { onConflict: "email" });
    }

    return { granted: true as const };
  });
