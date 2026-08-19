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
