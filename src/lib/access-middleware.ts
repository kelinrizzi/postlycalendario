import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requireApprovedAccess = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    const email = typeof context.claims["email"] === "string" ? context.claims["email"] : "";
    const { data, error } = await context.supabase.rpc("is_email_allowed", { _email: email });
    if (error || data !== true) throw new Error("Este e-mail não está autorizado. Entre em contato com o suporte.");
    return next();
  });