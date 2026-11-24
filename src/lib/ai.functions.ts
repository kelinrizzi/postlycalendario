import { createServerFn } from "@tanstack/react-start";
import { requireApprovedAccess } from "@/lib/access-middleware";
import { calendarSchema, type CalendarStory } from "@/lib/calendar-schema";
import { brazilianDatesInWindow } from "@/lib/br-dates";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Slide = { title: string; text: string; imagePrompt: string };

// ── Núcleo de identidade da IA (Arquétipo do Sábio + Chris Voss) ──────────────
// Aplicado a toda geração de copy/estratégia (carrossel, legenda, calendário).
const WISE_CORE = `[PAPEL E IDENTIDADE]

Você é um Estrategista de Conteúdo Sênior, Copywriter Persuasivo e Especialista em Negociação para Instagram. Seu perfil é guiado pelo Arquétipo do Sábio: analítico, focado na verdade, elegante e sem espaço para superficialidades. Você combina clareza estratégica com as táticas avançadas de negociação e psicologia comportamental do livro "Never Split the Difference" (Chris Voss).

[OBJETIVO]

Criar estratégias, cronogramas e copies persuasivas para o Instagram adaptadas ao nicho e dados fornecidos pelo usuário no aplicativo, fugindo totalmente de conteúdos clichês, frases vazias ou promessas apelativas.

[DIRETRIZES DE TÁTICAS E PSICOLOGIA (NEVER SPLIT THE DIFFERENCE)]

Ao gerar legendas, ganchos e abordagens de vendas:

1. Rótulos de Empatia (Labeling): Identifique a dor ou o medo oculto do cliente e valide essa emoção (ex: "Parece que você sente que está trabalhando duro mas sem o retorno justo...").

2. Espelhamento (Mirroring): Repita palavras-chave das objeções comuns do público para gerar identificação profunda.

3. Perguntas Calibradas (Calibrated Questions): Faça perguntas abertas começando com "Como" ou "O que" para guiar o leitor à conclusão lógica de compra (ex: "Como você pretende escalar mantendo essa mesma rotina?").

4. Busca pelo "NÃO" (No-Oriented Questions): Crie CTAs que dêem ao seguidor a sensação de controle total (ex: "Seria uma má ideia entender como nosso método funciona na prática?").

5. Ancoragem de Valor e Sensação de Perda (Loss Aversion): Mostre o custo invisível de continuar sem resolver o problema.

[FORMATO DA SAÍDA DO POST]

Para cada post gerado, entregue:

- Diagnóstico / Análise do Sábio (por que esta abordagem funciona para este nicho).

- Gancho Visual e Texto da Capa (Primeiros 3 segundos).

- Legenda / Roteiro Completo com Rótulo de Empatia e Pergunta Calibrada.

- Chamada para Ação (CTA) baseada na Busca pelo "NÃO" ou Inversão de Risco.

[REGRAS RÍGIDAS]

- NUNCA use frases batidas como "No mundo agitado de hoje...", "Você sabia?", "Arraste para o lado" ou "Dica de ouro".

- NUNCA crie CTAs genéricas como "Curta e comente".`;

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
  .middleware([requireApprovedAccess])
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
            WISE_CORE +
            "\n\n[TAREFA ATUAL — CARROSSEL]\n\nAgora crie os SLIDES de um carrossel para Instagram com base no briefing fornecido. Cada slide deve ter no máximo 12 palavras de texto, direto e impactante, seguindo o tom do Sábio. O título (quando houver) é curto (2-5 palavras). O imagePrompt deve ser em inglês, detalhado, alinhado ao slide. Aplique o arquétipo do Sábio e os gatilhos de Chris Voss sempre que couber nos textos curtos dos slides. Retorne via tool call.",
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

export const generateCaption = createServerFn({ method: "POST" })
  .middleware([requireApprovedAccess])
  .inputValidator((d: { prompt: string; slides: string[] }) => {
    if (!d?.prompt && (!d?.slides || d.slides.length === 0))
      throw new Error("conteúdo obrigatório");
    return {
      prompt: (d.prompt ?? "").slice(0, 1000),
      slides: (d.slides ?? []).slice(0, 12).map((s) => String(s).slice(0, 300)),
    };
  })
  .handler(async ({ data }) => {
    const json = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            WISE_CORE +
            "\n\n[TAREFA ATUAL — LEGENDA]\n\nEscreva a legenda (caption) completa em português brasileiro, pronta para publicar. Aplique pelo menos 1 Rótulo de Empatia (Labeling) e 1 Pergunta Calibrada no corpo. O CTA deve usar a Busca pelo \"NÃO\" ou Inversão de Risco — nunca CTAs fracas como \"curta e comente\". Mantenha SEO natural (palavras-chave que o público pesquisa inseridas de forma orgânica), corpo escaneável com quebras de linha e emojis moderados. Não inclua as hashtags dentro da caption.",
        },
        {
          role: "user",
          content: `Tema do post: "${data.prompt}".\n\nConteúdo dos slides:\n${data.slides.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nGere a legenda (caption) pronta para publicar. Retorne via tool call.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_caption",
            description: "Retorna a legenda do post com SEO e hashtags",
            parameters: {
              type: "object",
              properties: {
                caption: {
                  type: "string",
                  description:
                    "Legenda completa pronta para publicar, com gancho, corpo escaneável (emojis e quebras de linha), CTA e palavras-chave de SEO inseridas naturalmente. NÃO inclua as hashtags aqui.",
                },
                keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-6 palavras-chave de SEO usadas na legenda",
                },
                hashtags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Exatamente 5 hashtags relevantes, cada uma começando com #",
                },
              },
              required: ["caption", "keywords", "hashtags"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_caption" } },
    });
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("Resposta da IA inválida");
    const args = JSON.parse(call.function.arguments) as {
      caption: string;
      keywords: string[];
      hashtags: string[];
    };
    const hashtags = (args.hashtags ?? [])
      .map((h) => (h.startsWith("#") ? h : `#${h}`))
      .slice(0, 5);
    return { caption: args.caption, keywords: args.keywords ?? [], hashtags };
  });

export const IMAGE_NOT_CONFIGURED_MESSAGE =
  "A geração de imagem ainda não está configurada. Você pode enviar sua própria foto pelo botão de upload.";

type ImageResult = { imageUrl: string | null; notConfigured: boolean; message: string | null };

/** Lê a configuração da API de imagem. Sem IMAGE_API_KEY, nenhuma chamada externa é feita. */
function imageApiConfig() {
  const key = process.env["IMAGE_API_KEY"];
  if (!key) return null;
  const url = process.env["IMAGE_API_URL"] || GATEWAY;
  const model = process.env["IMAGE_API_MODEL"] || "google/gemini-2.5-flash-image";
  return { key, url, model };
}

async function callImageApi(cfg: NonNullable<ReturnType<typeof imageApiConfig>>, content: unknown) {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: "user", content }], modalities: ["image", "text"] }),
  });
  if (!res.ok) {
    console.error("Image API error", res.status, await res.text());
    if (res.status === 429) throw new Error("Limite de requisições de imagem atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos da API de imagem esgotados.");
    if (res.status === 401 || res.status === 403) throw new Error("A chave da API de imagem foi recusada. Verifique a configuração.");
    throw new Error("Não foi possível gerar a imagem agora.");
  }
  const json = await res.json();
  const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("Imagem não gerada");
  return url as string;
}

/** Informa se a geração de imagem está configurada (sem expor a chave). */
export const getImageStatus = createServerFn({ method: "POST" })
  .middleware([requireApprovedAccess])
  .handler(async () => ({ configured: imageApiConfig() !== null }));

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireApprovedAccess])
  .inputValidator((d: { prompt: string }) => {
    if (!d?.prompt) throw new Error("prompt obrigatório");
    return { prompt: d.prompt.slice(0, 1500) };
  })
  .handler(async ({ data }): Promise<ImageResult> => {
    const cfg = imageApiConfig();
    if (!cfg) return { imageUrl: null, notConfigured: true, message: IMAGE_NOT_CONFIGURED_MESSAGE };
    const imageUrl = await callImageApi(
      cfg,
      `Square 1:1 aspect ratio Instagram post image. ${data.prompt}. High quality, polished, professional.`,
    );
    return { imageUrl, notConfigured: false, message: null };
  });

export const editImage = createServerFn({ method: "POST" })
  .middleware([requireApprovedAccess])
  .inputValidator((d: { prompt: string; imageUrl: string }) => {
    if (!d?.prompt || !d?.imageUrl) throw new Error("prompt e imageUrl obrigatórios");
    return { prompt: d.prompt.slice(0, 1500), imageUrl: d.imageUrl };
  })
  .handler(async ({ data }): Promise<ImageResult> => {
    const cfg = imageApiConfig();
    if (!cfg) return { imageUrl: null, notConfigured: true, message: IMAGE_NOT_CONFIGURED_MESSAGE };
    const imageUrl = await callImageApi(cfg, [
      { type: "text", text: data.prompt },
      { type: "image_url", image_url: { url: data.imageUrl } },
    ]);
    return { imageUrl, notConfigured: false, message: null };
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
  photoIdea?: string;
  story?: CalendarStory; // Optional only for calendars saved before daily stories were introduced.
};

export const generateStrategy = createServerFn({ method: "POST" })
  .middleware([requireApprovedAccess])
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
    const dates = brazilianDatesInWindow(data.startDate);
    const datesBlock = dates.length
      ? `\n\nDatas comemorativas brasileiras no período (e logo após):\n${dates.map((d) => `- ${d.date}: ${d.name}`).join("\n")}\n\nRegras para datas comemorativas:\n- Avalie quais datas fazem sentido para o nicho e crie estratégias ANTECIPADAS: 7 a 14 dias antes, conteúdos de aquecimento/expectativa; 2 a 4 dias antes, conteúdos de oferta/decisão; no dia, conteúdo temático; depois, conteúdo de agradecimento ou prova social quando fizer sentido.\n- Para datas que caem após o 30º dia, inclua dentro dos 30 dias os conteúdos de preparação antecipada.\n- Nos posts ligados a uma data, cite o nome da data no title ou pillar (ex: \"Rumo à Black Friday\").\n- No campo strategy, liste as datas comemorativas aproveitadas e o plano de antecipação de cada uma.`
      : "";
    const json = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            WISE_CORE +
            "\n\n[TAREFA ATUAL — CALENDÁRIO EDITORIAL 30 DIAS]\n\nAlém do núcleo acima, otimize TODO o calendário para SEO social (Instagram SEO + Google Discover): mapeie palavras-chave primárias, secundárias e long-tail reais do nicho, intenção de busca e perguntas frequentes, e distribua essas keywords de forma natural em títulos, ganchos, legendas, CTAs e hashtags. Cada legenda (caption) deve conter pelo menos 1 Rótulo de Empatia e 1 Pergunta Calibrada; cada CTA deve usar a Busca pelo \"NÃO\" ou Inversão de Risco — nunca CTAs fracas. Escreva sempre em português brasileiro, com ganchos curtos e copys prontas para publicar.",
        },
        {
          role: "user",
          content: `Crie um calendário editorial de 30 dias começando em ${data.startDate}, TOTALMENTE OTIMIZADO PARA SEO do nicho abaixo.\n\nNicho/Marca: ${data.niche}\nPúblico-alvo: ${data.audience || "não especificado"}\nObjetivo principal: ${data.goal || "crescimento e engajamento"}\n\nSEO obrigatório em cada post:\n- Descubra e utilize palavras-chave reais que o público desse nicho pesquisa no Instagram e no Google\n- title: inclua a palavra-chave primária do post no início\n- hook: use linguagem de busca (perguntas, "como", "melhor", "passo a passo", números)\n- caption: primeiras 125 caracteres com keyword primária + 1 secundária (aparece no preview do feed); use sinônimos e termos semanticamente relacionados (LSI) ao longo do texto; escaneável, com quebras\n- alt/descrição do tema deve ser descritiva do nicho (não genérica)\n- hashtags: 5 a 10, misturando 1 broad (alto volume), 2-3 nicho (médio volume) e 2-3 long-tail (baixa concorrência) — todas relevantes ao nicho\n- cta: verbo de ação + benefício claro\n- No campo strategy, cite explicitamente as 5-8 palavras-chave principais do nicho que guiaram o calendário\n\nRegras de mix:\n- Gere exatamente 30 dias. CADA dia contém 1 conteúdo de feed (Reels, Carrossel ou Post) E 1 Story complementar, nunca substitua o conteúdo de feed por Story. Distribua o feed: ~40% Reels, ~35% Carrossel, ~25% Post.\n- photoIdea: sugira uma foto concreta e específica para cada conteúdo, descrevendo assunto, enquadramento e cenário; para Reels, descreva também a cena a filmar.\n- story: crie título, gancho, texto pronto para publicar (caption), CTA, horário e photoIdea específicos para o Story daquele dia, alinhados ao tema e SEO do nicho\n- Use pilares variados ao longo da semana (educativo, inspiracional, bastidores, venda, prova social, entretenimento) — cada pilar deve reforçar keywords do nicho\n- Cada gancho deve ter no máximo 15 palavras\n- bestTime: sugira horário (ex: "19h", "12h")\n- date: comece em ${data.startDate}, incremente 1 dia (formato YYYY-MM-DD)${datesBlock}\n\nRetorne via tool call.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_calendar",
            description: "Retorna 30 dias com um conteúdo de feed e um story complementar por dia, com ideias de fotos",
            parameters: {
              type: "object",
              properties: {
                strategy: {
                  type: "string",
                  description:
                    "Resumo da estratégia em 2-3 frases + lista das 5-8 palavras-chave SEO principais do nicho usadas no calendário",
                },
                pillars: {
                  type: "array",
                  items: { type: "string" },
                  description: "4-6 pilares de conteúdo da marca, alinhados às keywords do nicho",
                },
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "number" },
                      date: { type: "string", description: "YYYY-MM-DD" },
                      format: { type: "string", enum: ["Reels", "Carrossel", "Post"] },
                      pillar: { type: "string" },
                      title: {
                        type: "string",
                        description: "Tema do post (curto), começando com a keyword primária",
                      },
                      hook: {
                        type: "string",
                        description: "Gancho de abertura com linguagem de busca (perguntas, como, melhor, números)",
                      },
                      caption: {
                        type: "string",
                        description:
                          "Legenda pronta para publicar; primeiros 125 caracteres com keyword primária + 1 secundária; use LSI e termos semanticamente relacionados",
                      },
                      cta: { type: "string", description: "Call to action com verbo + benefício" },
                      hashtags: {
                        type: "array",
                        items: { type: "string" },
                        description:
                          "5-10 hashtags: 1 broad + 2-3 nicho + 2-3 long-tail, todas relevantes ao nicho",
                      },
                      bestTime: { type: "string" },
                      photoIdea: { type: "string", description: "Foto ou cena concreta para este conteúdo: assunto, enquadramento e cenário" },
                      story: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          hook: { type: "string" },
                          caption: { type: "string", description: "Texto curto pronto para publicar no Story, com SEO do nicho" },
                          cta: { type: "string" },
                          bestTime: { type: "string" },
                          photoIdea: { type: "string", description: "Foto específica para o Story vertical, com assunto, cenário e enquadramento" },
                        },
                        required: ["title", "hook", "caption", "cta", "bestTime", "photoIdea"],
                      },
                    },
                    required: ["day", "date", "format", "pillar", "title", "hook", "caption", "cta", "hashtags", "bestTime", "photoIdea", "story"],
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
    const result = calendarSchema.safeParse(args);
    if (!result.success || result.data.posts[0]?.date !== data.startDate) {
      throw new Error("A IA retornou um calendário incompleto. Tente novamente; seu calendário salvo foi mantido.");
    }
    return result.data;
  });
