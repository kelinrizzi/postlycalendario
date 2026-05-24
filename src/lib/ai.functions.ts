import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Slide = { title: string; text: string; imagePrompt: string };

async function callAI(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Settings → Workspace → Usage.");
    throw new Error(`AI error ${res.status}: ${t}`);
  }
  return res.json();
}

export const generateCarousel = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; slideCount: number }) => {
    if (!d?.prompt || typeof d.prompt !== "string") throw new Error("prompt obrigatório");
    const count = Math.min(Math.max(d.slideCount ?? 3, 1), 10);
    return { prompt: d.prompt.slice(0, 1000), slideCount: count };
  })
  .handler(async ({ data }) => {
    const json = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você é um designer de conteúdo para Instagram. Crie posts envolventes em português, com textos curtos, impactantes e diretos. Cada slide deve ter no máximo 12 palavras.",
        },
        {
          role: "user",
          content: `Crie um carrossel de ${data.slideCount} slide(s) para Instagram sobre: "${data.prompt}". Retorne via tool call.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_carousel",
            description: "Retorna os slides do carrossel",
            parameters: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "Título curto de impacto (2-5 palavras). Pode ser vazio se o slide não precisar de título.",
                      },
                      text: { type: "string", description: "Texto curto e impactante do slide (até 12 palavras)" },
                      imagePrompt: {
                        type: "string",
                        description: "Prompt em inglês detalhado para gerar imagem fotográfica/ilustração que combine com o slide",
                      },
                    },
                    required: ["title", "text", "imagePrompt"],
                  },

                },
              },
              required: ["slides"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_carousel" } },
    });
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("Resposta da IA inválida");
    const args = JSON.parse(call.function.arguments);
    return { slides: args.slides as Slide[] };
  });

export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string }) => {
    if (!d?.prompt) throw new Error("prompt obrigatório");
    return { prompt: d.prompt.slice(0, 1500) };
  })
  .handler(async ({ data }) => {
    const json = await callAI({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: `Square 1:1 aspect ratio Instagram post image. ${data.prompt}. High quality, polished, professional.`,
        },
      ],
      modalities: ["image", "text"],
    });
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("Imagem não gerada");
    return { imageUrl: url as string };
  });

export const editImage = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; imageUrl: string }) => {
    if (!d?.prompt || !d?.imageUrl) throw new Error("prompt e imageUrl obrigatórios");
    return { prompt: d.prompt.slice(0, 1500), imageUrl: d.imageUrl };
  })
  .handler(async ({ data }) => {
    const json = await callAI({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: data.prompt },
            { type: "image_url", image_url: { url: data.imageUrl } },
          ],
        },
      ],
      modalities: ["image", "text"],
    });
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("Imagem não editada");
    return { imageUrl: url as string };
  });

export type CalendarPost = {
  day: number;
  date: string; // YYYY-MM-DD
  format: "Reels" | "Carrossel" | "Post" | "Story";
  pillar: string;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  bestTime: string;
};

export const generateStrategy = createServerFn({ method: "POST" })
  .inputValidator((d: { niche: string; audience: string; goal: string; startDate: string }) => {
    if (!d?.niche) throw new Error("nicho obrigatório");
    return {
      niche: d.niche.slice(0, 300),
      audience: (d.audience ?? "").slice(0, 300),
      goal: (d.goal ?? "").slice(0, 300),
      startDate: d.startDate,
    };
  })
  .handler(async ({ data }) => {
    const json = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você é um estrategista de conteúdo sênior para Instagram. Crie calendários editoriais de 30 dias variados, com mix de formatos (Reels, Carrossel, Post, Story), pilares de conteúdo coerentes (educativo, inspiracional, bastidores, venda, prova social, entretenimento), copys curtas e ganchos fortes em português brasileiro.",
        },
        {
          role: "user",
          content: `Crie um calendário editorial de 30 dias começando em ${data.startDate}.\n\nNicho/Marca: ${data.niche}\nPúblico-alvo: ${data.audience || "não especificado"}\nObjetivo principal: ${data.goal || "crescimento e engajamento"}\n\nRegras:\n- Distribua os formatos: ~40% Reels, ~30% Carrossel, ~20% Post, ~10% Story\n- Use pilares variados ao longo da semana\n- Cada gancho deve ter no máximo 15 palavras\n- Hashtags: 5 a 10 por post, relevantes ao nicho\n- bestTime: sugira horário (ex: "19h", "12h")\n- date: comece em ${data.startDate}, incremente 1 dia (formato YYYY-MM-DD)\nRetorne via tool call.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_calendar",
            description: "Retorna calendário editorial de 30 dias",
            parameters: {
              type: "object",
              properties: {
                strategy: {
                  type: "string",
                  description: "Resumo da estratégia geral em 2-3 frases",
                },
                pillars: {
                  type: "array",
                  items: { type: "string" },
                  description: "4-6 pilares de conteúdo da marca",
                },
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "number" },
                      date: { type: "string", description: "YYYY-MM-DD" },
                      format: { type: "string", enum: ["Reels", "Carrossel", "Post", "Story"] },
                      pillar: { type: "string" },
                      title: { type: "string", description: "Tema do post (curto)" },
                      hook: { type: "string", description: "Gancho de abertura impactante" },
                      caption: { type: "string", description: "Legenda completa pronta para publicar" },
                      cta: { type: "string", description: "Call to action" },
                      hashtags: { type: "array", items: { type: "string" } },
                      bestTime: { type: "string" },
                    },
                    required: ["day", "date", "format", "pillar", "title", "hook", "caption", "cta", "hashtags", "bestTime"],
                  },
                },
              },
              required: ["strategy", "pillars", "posts"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_calendar" } },
    });
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("Resposta da IA inválida");
    const args = JSON.parse(call.function.arguments);
    return args as { strategy: string; pillars: string[]; posts: CalendarPost[] };
  });
