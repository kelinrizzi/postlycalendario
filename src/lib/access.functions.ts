import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email().max(255),
});

/**
 * Verifica se um e-mail está liberado (status "approved") na lista de convites.
 * Retorna apenas um booleano — nenhum dado sensível é exposto.
 */
export const checkEmailAllowed = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allowed, error } = await supabaseAdmin.rpc("is_email_allowed", {
      _email: data.email.toLowerCase(),
    });
    if (error) throw new Error(error.message);
    return { allowed: allowed === true };
  });

/**
 * Para e-mails aprovados, informa se a pessoa já criou a senha (conta existente).
 * Para e-mails não aprovados, retorna apenas allowed=false.
 */
export const checkLoginStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: allowed, error } = await supabaseAdmin.rpc("is_email_allowed", { _email: email });
    if (error) throw new Error(error.message);
    if (allowed !== true) return { allowed: false, hasPassword: false };
    let hasPassword = false;
    for (let page = 1; page <= 20 && !hasPassword; page++) {
      const { data: list, error: e } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (e) throw new Error(e.message);
      hasPassword = list.users.some((u) => (u.email ?? "").toLowerCase() === email);
      if (list.users.length < 1000) break;
    }
    return { allowed: true, hasPassword };
  });
