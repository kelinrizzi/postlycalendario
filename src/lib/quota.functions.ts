import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireApprovedAccess } from "@/lib/access-middleware";

export type QuotaBalance = {
  content_used: number;
  content_limit: number;
  calendar_used: number;
  calendar_limit: number;
};

export type QuotaConsumeResult = QuotaBalance & {
  allowed: boolean;
  reason: string | null;
};

const quotaTypeSchema = z.object({
  quotaType: z.enum(["content", "calendar"]),
});

function claimEmail(claims: Record<string, unknown>): string {
  return typeof claims["email"] === "string" ? claims["email"] : "";
}

/**
 * Consome 1 unidade de cota ("content" ou "calendar") do ciclo de 30 dias.
 * O e-mail vem da sessão autenticada — nunca do cliente.
 */
export const consumeQuota = createServerFn({ method: "POST" })
  .middleware([requireApprovedAccess])
  .inputValidator((data: unknown) => quotaTypeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("consume_user_quota", {
      _email: claimEmail(context.claims),
      _quota_type: data.quotaType,
    });
    if (error) throw new Error(error.message);
    return result as unknown as QuotaConsumeResult;
  });

/** Saldo atual do ciclo de 30 dias, sem consumir. */
export const getQuotaBalance = createServerFn({ method: "POST" })
  .middleware([requireApprovedAccess])
  .handler(async ({ context }) => {
    const { data: result, error } = await context.supabase.rpc("get_user_quota", {
      _email: claimEmail(context.claims),
    });
    if (error) throw new Error(error.message);
    return result as unknown as QuotaBalance;
  });
