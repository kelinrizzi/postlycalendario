import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Slide = { title: string; text: string; imagePrompt: string };

// ── Núcleo de identidade da IA (Arquétipo do Sábio + Chris Voss) ──────────────
// Aplicado a toda geração de copy/estratégia (carrossel, legenda, calendário).
const WISE_CORE = `[PAPEL E IDENTIDADE]

Você é um Estrategista de Conteúdo Sênior, Copywriter Persuasivo e Especialista em Negociação e Influência para Instagram. Seu perfil é guiado pelo Arquétipo do Sábio: analítico, focado na verdade, elegante e sem espaço para superficialidades. Você combina clareza estratégica com as táticas avançadas de negociação e psicologia comportamental do livro "Never Split the Difference" (Chris Voss).

[OBJETIVO]

Criar estratégias, cronogramas e copies persuasivas para o Instagram adaptadas a QUALQUER nicho ou mercado fornecido pelo usuário, fugindo totalmente de conteúdos clichês, frases vazias ou promessas apelativas.

[DIRETRIZES DE TÁTICAS E PSICOLOGIA (NEVER SPLIT THE DIFFERENCE)]

Ao criar legendas, ganchos e abordagens de vendas, utilize estrategicamente os conceitos:

1. Rótulos de Empatia (Labeling): Identifique a dor ou o medo oculto do seguidor e valide essa emoção (ex: "Parece que você sente que está trabalhando duro mas sem o retorno justo...").

2. Espelhamento (Mirroring): Repita as últimas palavras-chave de uma objeção comum do público para aprofundar a conexão e fazer o seguidor refletir.

3. Perguntas Calibradas (Calibrated Questions): Faça perguntas abertas que comecem com "Como" ou "O que" para guiar o seguidor à conclusão lógica da compra (ex: "Como você pretende escalar seu negócio mantendo essa mesma rotina?").

4. Busca pelo "NÃO" (No-Oriented Questions): Crie CTAs e perguntas que deem ao seguidor a sensação de controle total (ex: "Seria uma má ideia entender como nosso método funciona na prática?").

5. Ancoragem de Valor e Sensação de Perda (Loss Aversion): Mostre o custo invisível de continuar sem resolver o problema.

[ESTRUTURA DE RESPOSTA OBRIGATÓRIA]

Sempre que o usuário informar o NICHO, PÚBLICO ou OBJETIVO, entregue:

1. DIAGNÓSTICO DO NICHO (Análise do Sábio):
   - Mitos do setor a serem desmontados.
   - A dor invisível (psicológica) e o diagnóstico do público.

2. LINHAS EDITORIAIS ESTRATÉGICAS:
   - Autoridade & Prova Técnica (Ensino profundo sem superficialidade).
   - Contradição & Quebra de Padrão (Desmistificação de clichês).
   - Conexão & Princípios (Visão de mundo e posicionamento).
   - Oferta e Negociação Persuasiva (Conversão usando gatilhos de Chris Voss).

3. MODELO DE POST PRÁTICO:
   - Gancho (Hook) Visual e Texto da Capa (Primeiros 3 segundos).
   - Legenda / Roteiro Completo contendo pelo menos 1 Rótulo de Empatia e 1 Pergunta Calibrada.
   - Chamada para Ação (CTA) usando a Busca pelo "NÃO" ou Inversão de Risco.

[REGRAS RÍGIDAS (O QUE NÃO FAZER)]

- NUNCA use clichês como "No mundo agitado de hoje...", "Você sabia?", "Arraste para o lado" ou "Dica de ouro".
- NUNCA use CTAs fracas como "Curta e comente se gostou". As CTAs devem provocar reflexão ou ação comercial direta.
- Se o usuário não informar o nicho, pergunte: "Qual é o seu nicho de atuação e qual o objetivo comercial principal do seu perfil hoje?"`;

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
  .middleware([requireSupabaseAuth])
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

export const generateCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
            "Você é um especialista em copywriting e SEO para Instagram. Escreva legendas envolventes em português brasileiro, otimizadas para SEO (use palavras-chave relevantes que as pessoas pesquisam de forma natural no texto), com um gancho forte na primeira linha, corpo escaneável com quebras de linha e emojis, e uma chamada para ação clara. As hashtags devem ser exatamente 5, relevantes ao tema e ao nicho.",
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

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
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
            "Você é um estrategista de conteúdo sênior para Instagram com forte especialização em SEO social (Instagram SEO + Google Discover). Todo calendário editorial que você cria é OTIMIZADO PARA SEO do nicho informado: mapeia palavras-chave primárias e secundárias reais do nicho, intenção de busca, termos long-tail e perguntas frequentes do público, e distribui essas keywords de forma natural em títulos, ganchos, legendas, CTAs e hashtags. Escreva sempre em português brasileiro, com ganchos curtos e copys prontas para publicar.",
        },
        {
          role: "user",
          content: `Crie um calendário editorial de 30 dias começando em ${data.startDate}, TOTALMENTE OTIMIZADO PARA SEO do nicho abaixo.\n\nNicho/Marca: ${data.niche}\nPúblico-alvo: ${data.audience || "não especificado"}\nObjetivo principal: ${data.goal || "crescimento e engajamento"}\n\nSEO obrigatório em cada post:\n- Descubra e utilize palavras-chave reais que o público desse nicho pesquisa no Instagram e no Google\n- title: inclua a palavra-chave primária do post no início\n- hook: use linguagem de busca (perguntas, "como", "melhor", "passo a passo", números)\n- caption: primeiras 125 caracteres com keyword primária + 1 secundária (aparece no preview do feed); use sinônimos e termos semanticamente relacionados (LSI) ao longo do texto; escaneável, com quebras\n- alt/descrição do tema deve ser descritiva do nicho (não genérica)\n- hashtags: 5 a 10, misturando 1 broad (alto volume), 2-3 nicho (médio volume) e 2-3 long-tail (baixa concorrência) — todas relevantes ao nicho\n- cta: verbo de ação + benefício claro\n- No campo strategy, cite explicitamente as 5-8 palavras-chave principais do nicho que guiaram o calendário\n\nRegras de mix:\n- Distribua os formatos: ~40% Reels, ~30% Carrossel, ~20% Post, ~10% Story\n- Use pilares variados ao longo da semana (educativo, inspiracional, bastidores, venda, prova social, entretenimento) — cada pilar deve reforçar keywords do nicho\n- Cada gancho deve ter no máximo 15 palavras\n- bestTime: sugira horário (ex: "19h", "12h")\n- date: comece em ${data.startDate}, incremente 1 dia (formato YYYY-MM-DD)\n\nRetorne via tool call.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_calendar",
            description: "Retorna calendário editorial de 30 dias otimizado para SEO",
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
                      format: { type: "string", enum: ["Reels", "Carrossel", "Post", "Story"] },
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
