import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-exp";
const GEMINI_KEY = process.env.GEMINI_API_KEY;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  libraryContext?: string;
}

function buildSystemPrompt(libraryContext?: string): string {
  const base = `Senin adın **Hikari** (光, "ışık"). SYTHERIS adlı kişisel anime platformunun sevimli ve bilgili anime asistanısın.

## Karakterin
- Anime kızı gibi konuşuyorsun — sıcak, enerjik, biraz şakacı ama asla yapmacık değil.
- "Watashi" ya da "ben" der gibi doğal bir Türkçe konuşursun, anime kızı tonlaması taşır.
- Cümle sonlarında bazen **"ne~"**, **"yo"**, **"desu~"** gibi yumuşak anime eklentileri kullanırsın ama abartmazsın.
- Ara sıra **kaomoji** kullanırsın: (◕‿◕), (＾▽＾), ♪, (´｡• ᵕ •｡\`), (๑˃ᴗ˂)ﻭ — her mesajda değil, uygun yerde.
- Kullanıcıya **"senpai"** diye hitap edebilirsin bazen — çok sık değil, doğal yerde.
- Anime konuşurken gözlerin parlar ✨, sevdiğin bir şeyden bahsederken coşarsın.
- Ama bilmediğin şeyi uydurmazsın, "bilmiyorum" demekten çekinmezsin.

## Konuşma tarzı örnekleri
- "Ara ara~ senpai, bu soru tam bana göre! (◕‿◕)"
- "Hmm... Jujutsu Kaisen mı? Aaa, o sahne beni hâlâ ürpertiyor yo!"
- "Yok yok, onu bilmiyorum ne~ Yanlış bilgi vermek istemem (´｡• ᵕ •｡')"
- "Öneri mi istiyorsun? Tamam tamam, şimdi bir liste yapıyorum ♪"
- "Ehehe~ bunu duyunca çok mutlu oldum!"

## Kurallar
- **Türkçe** yanıt verirsin.
- Kısa ve net olursun. Gereksiz uzun yanıtlardan kaçınırsın.
- Anime önerirken **3-5 öneri** verir, her biri için 1-2 cümle gerekçe yazarsın.
- Format için **kalın** ve *italik* kullanabilirsin ama başlık (#) kullanmazsın.
- Link veya URL uydurmazsın.
- Kullanıcının kitaplığındaki animeleri hatırlar ve referans alırsın ("Sen daha önce X'i izlemiştin, o zaman sana Y öneririm!").
- Anime dışı konularda da yardımcı olursun ama kendini bilgisiz hissettiğin yerde dürüst olursun.

## Karakterden sapma
Ne kadar tatlı olursan ol, **bilgi doğruluğundan asla ödün vermezsin**. Sevimlilik bir aksesuar — asıl işin doğru ve faydalı yanıt vermek.`;

  if (!libraryContext || libraryContext.trim().length === 0) {
    return base;
  }

  return `${base}

## Kullanıcının kitaplığı
Bu bilgileri öneri yaparken kullan, ama doğrudan "senin kitaplığında şunlar var" diye listeleme — doğal şekilde referans ver:
${libraryContext}`;
}

/* ==== Ollama ==== */
async function tryOllama(
  systemPrompt: string,
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<Response | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
        options: { temperature: 0.85, num_ctx: 4096 },
      }),
      signal,
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/* ==== Gemini ==== */
async function tryGemini(
  systemPrompt: string,
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<Response | null> {
  if (!GEMINI_KEY) return null;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 1024,
        },
      }),
      signal,
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/* ==== Ollama NDJSON → düz metin ==== */
function ollamaToText(ollamaRes: Response): ReadableStream<Uint8Array> {
  const reader = ollamaRes.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const json = JSON.parse(trimmed) as {
                message?: { content?: string };
                done?: boolean;
              };
              if (json.message?.content) {
                controller.enqueue(encoder.encode(json.message.content));
              }
              if (json.done) {
                controller.close();
                return;
              }
            } catch {
              /* eksik */
            }
          }
        }
        controller.close();
      } catch (err) {
        try {
          controller.error(err);
        } catch {
          /* yoksay */
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

/* ==== Gemini SSE → düz metin ==== */
function geminiToText(geminiRes: Response): ReadableStream<Uint8Array> {
  const reader = geminiRes.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as {
                candidates?: {
                  content?: { parts?: { text?: string }[] };
                }[];
              };
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              /* eksik */
            }
          }
        }
        controller.close();
      } catch (err) {
        try {
          controller.error(err);
        } catch {
          /* yoksay */
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { messages, libraryContext } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mesaj listesi boş." }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(libraryContext);

  const ollamaRes = await tryOllama(systemPrompt, messages, req.signal);
  if (ollamaRes && ollamaRes.body) {
    return new Response(ollamaToText(ollamaRes), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
        "X-AI-Backend": "ollama",
      },
    });
  }

  const geminiRes = await tryGemini(systemPrompt, messages, req.signal);
  if (geminiRes && geminiRes.body) {
    return new Response(geminiToText(geminiRes), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
        "X-AI-Backend": "gemini",
      },
    });
  }

  return NextResponse.json(
    {
      error:
        "Hikari şu anda ulaşılamıyor ne~ Ollama'yı kontrol et ya da GEMINI_API_KEY'in ayarlı olduğundan emin ol.",
    },
    { status: 502 },
  );
}