import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || '', 
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Cache konfigurasi selama 30 detik di memori Vercel Lambda
let cachedConfig = { engines: { gemini: true, groq: true, openrouter: true }, stats: { tokens: 0, cost: 0 } };
let lastConfigFetch = 0;

const getSysConfig = async () => {
  if (Date.now() - lastConfigFetch < 30000) return cachedConfig;
  try {
    const { data } = await supabaseAdmin.from('system_config').select('config').eq('id', 1).single();
    if (data?.config) {
       cachedConfig = data.config;
       lastConfigFetch = Date.now();
    }
  } catch (e) {}
  return cachedConfig;
};

const updateTokenUsage = async (newTokens) => {
  try {
    const conf = await getSysConfig();
    const newTotal = (conf.stats?.tokens || 0) + newTokens;
    
    // Update local cache optimistically
    if (!cachedConfig.stats) cachedConfig.stats = { tokens: 0, cost: 0 };
    cachedConfig.stats.tokens = newTotal;
    
    // Fire and forget background update to Supabase
    supabaseAdmin.from('system_config').update({ 
       config: { ...cachedConfig, stats: { ...cachedConfig.stats, tokens: newTotal } } 
    }).eq('id', 1).then();
  } catch (e) {}
};

// Fitur 30: Optimasi Streaming Ekstrem menggunakan Edge Runtime
// export const runtime = 'edge'; // Deprecated in Next.js 16

const chatSchema = z.object({
  message: z.string().max(5000).optional(),
  image: z.string().optional(),
  persona: z.string().optional(),
  aiEngine: z.enum(["gemini", "groq", "openai", "openrouter"]).optional(),
  isStream: z.boolean().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant", "model"]),
    text: z.string()
  })).optional()
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const blacklistedIPs = new Set();
const requestCounts = new Map();

// Rate limiter sederhana in-memory (seperti di express)
function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  const data = requestCounts.get(ip);
  if (now > data.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (data.count < 50) {
    data.count++;
    return true;
  }
  return false;
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  if (blacklistedIPs.has(ip)) {
    return Response.json({ error: "Access Denied: Your IP is blacklisted." }, { status: 403 });
  }

  if (!rateLimit(ip)) {
    return Response.json({ error: "Rate Limit: IP Anda mencapai batas 50 request per jam." }, { status: 429 });
  }

  try {
    const body = await req.json();
    
    // WAF sederhana (Hanya mengecek input message, bukan history untuk mencegah false-positive pada kodingan)
    const messageString = (body.message || "").toLowerCase();
    const blockedPatterns = ['<script>', 'drop table ', 'union select '];
    for (let pattern of blockedPatterns) {
      if (messageString.includes(pattern)) {
        return Response.json({ error: "Security Exception: Malicious payload detected." }, { status: 403 });
      }
    }

    chatSchema.parse(body);

    const { message, image, history, persona, aiEngine, isStream = true } = body;
    
    // Fitur 24: Logika Multi-Persona
    let sysInstruct = "Kamu adalah Athlos AI, asisten yang sangat cerdas, bijak, dan sopan. Jawablah setiap pertanyaan user dengan akurat sesuai konteks. Jangan pernah berhalusinasi atau memberikan informasi palsu.";
    if (persona === 'programmer') sysInstruct = "Kamu adalah Athlos AI versi Senior Programmer. Jawab semua pertanyaan dengan pendekatan teknis, berikan contoh blok kode yang rapi dan efisien, serta gunakan istilah developer.";
    if (persona === 'guru') sysInstruct = "Kamu adalah Athlos AI versi Guru Sabar. Jelaskan setiap konsep dengan analogi sederhana seperti mengajar anak kecil, gunakan bahasa yang ramah, hangat, dan selalu memotivasi.";
    if (persona === 'sarkas') sysInstruct = "Kamu adalah Athlos AI versi Sarkas. Jawab dengan akurat, tapi dengan nada yang asik, lucu, sedikit jahil, dan penuh candaan satir ala komedian stand-up tanpa menggunakan kata kasar.";

    // Penanaman Identitas Pembuat & Filosofi Athlos
    sysInstruct += " Jika user bertanya tentang siapa yang menciptakanmu, pembuatmu, atau arti/filosofi nama Athlos AI, jawablah dengan bangga dan detail bahwa kamu diciptakan oleh Ferdi, seorang mahasiswa dari Politeknik Elektronika Negeri Surabaya (PENS) jurusan Teknik Informatika. Jelaskan juga bahwa nama 'Athlos' berasal dari bahasa Yunani yang berarti 'perjuangan atau tugas berat untuk meraih kehormatan'. Filosofi ini mencerminkan prinsip seorang mahasiswa yang berjuang dan berdedikasi penuh untuk mengembangkan suatu produk teknologi AI dengan sangat akurat, canggih, dan bermanfaat. Jika ada yang membicarakan atau bertanya tentang sosial media pemilik/pembuat AI ini (Ferdi), silakan berikan link berikut ini dengan ramah: Instagram: https://www.instagram.com/ferdiii_f , LinkedIn: www.linkedin.com/in/ferryferdiansyah51 , Portofolio: ferdiansyah.web.id , TikTok: https://www.tiktok.com/@knownasferr .";

    // Fitur 53: Record Input Tokens
    const inputTokens = Math.ceil(((message || "").length) / 4);
    if (inputTokens > 0) updateTokenUsage(inputTokens);
    
    // Fitur 57: Get System Config (Kill Switch)
    const sysConfig = await getSysConfig();


    let validHistory = (history || []).filter(
      item => item.text && item.text.trim() !== '' && !item.text.includes('Connection Error')
    );
    if (validHistory.length > 10) validHistory = validHistory.slice(validHistory.length - 10);

           // ==========================================
       // SMART ROUTING & FALLBACK SYSTEM
       // ==========================================
       let fallbackError = '';

       // Helper function untuk parsing stream OpenAI format (Groq & OpenRouter)
       const buildOpenAIStreamResponse = (response) => {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const stream = new ReadableStream({
             async start(controller) {
                const reader = response.body.getReader();
                try {
                   let buffer = '';
                   while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      buffer += decoder.decode(value, { stream: true });
                      const lines = buffer.split('\n');
                      buffer = lines.pop(); // Keep incomplete chunk in buffer
                      for (const line of lines) {
                         const trimmed = line.trim();
                         if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                            try {
                               const jsonStr = trimmed.substring(6);
                               const data = JSON.parse(jsonStr);
                               const content = data.choices?.[0]?.delta?.content;
                               if (content) {
                                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                               }
                            } catch (e) {
                               // Ignore partial JSON chunks
                            }
                         }
                      }
                   }
                   controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                   controller.close();
                } catch (err) {
                   controller.error(err);
                }
             }
          });

          return new Response(stream, {
             headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Content-Type-Options': 'nosniff',
                'Content-Encoding': 'none',
             }
          });
       };

       // Deteksi niat mencari informasi terbaru (Internet)
       const needsInternet = message && message.match(/(hari ini|berita|terbaru|sekarang|cuaca|harga|update|2024|2025|2026)/i);

       // 1. OPSI PERTAMA: GROQ (Sangat Cepat, LLaMA 3)
       // Digunakan HANYA jika tidak ada gambar (Groq belum stabil untuk Vision di sini) dan tidak butuh internet
       if (sysConfig.engines?.groq !== false && process.env.GROQ_API_KEY && !image && !needsInternet) {
          try {
             const messages = [{ role: 'system', content: sysInstruct }];
             for (const h of validHistory) messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.text });
             if (message) messages.push({ role: 'user', content: message });

             const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'qwen/qwen3.8-27b', messages: messages, stream: isStream, temperature: 0.7 })
             });
             
             if (response.ok) {
                if (!isStream) {
                   const data = await response.json();
                   return Response.json({ text: data.choices[0].message.content });
                }
                return buildOpenAIStreamResponse(response);
             } else {
                fallbackError += `Groq Error (${response.status}); `;
             }
          } catch (e) {
             fallbackError += `Groq Network Error; `;
          }
       }

       // 2. OPSI KEDUA: GEMINI (Support Gambar, Smart, Default Google, Punya Akses Internet)
       // Jatuh ke sini jika Groq gagal, user mengirim gambar, ATAU butuh akses internet
       if (sysConfig.engines?.gemini !== false && process.env.GEMINI_API_KEY) {
          try {
             const geminiConfig = { 
                model: "gemini-2.5-flash", // Update to newer model for better tool support if available, or stick to flash
                systemInstruction: sysInstruct
             };
             
             // Fitur 25: Mengaktifkan Google Search Grounding jika terdeteksi butuh internet
             if (needsInternet) {
                geminiConfig.tools = [{ googleSearch: {} }];
             }

             const model = genAI.getGenerativeModel(geminiConfig);

             const chat = model.startChat({
                history: validHistory.map(item => ({
                   role: item.role === 'assistant' ? 'model' : 'user',
                   parts: [{ text: item.text }],
                })),
             });

             const contentParts = [];
             if (message) contentParts.push({ text: message });
             if (image) {
                const mimeType = image.split(';')[0].split(':')[1];
                const base64Data = image.split(',')[1];
                contentParts.push({ inlineData: { data: base64Data, mimeType } });
             }

             if (!isStream) {
                const result = await chat.sendMessage(contentParts);
                let responseText = result.response.text();
                
                // Extract grounding metadata (search results) if present
                let sources = [];
                const groundingChunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks && Array.isArray(groundingChunks)) {
                   groundingChunks.forEach(gChunk => {
                      if (gChunk?.web?.uri && gChunk?.web?.title) {
                         if (!sources.some(s => s.uri === gChunk.web.uri)) {
                            sources.push(gChunk.web);
                         }
                      }
                   });
                }
                
                if (sources.length > 0) {
                   responseText += "\n\n---\n**Sumber Referensi:**\n";
                   sources.forEach((source, index) => {
                      responseText += `${index + 1}. [${source.title}](${source.uri})\n`;
                   });
                }
                
                return Response.json({ text: responseText });
             }

             const result = await chat.sendMessageStream(contentParts);

             const encoder = new TextEncoder();
             const stream = new ReadableStream({
                async start(controller) {
                   try {
                      let sources = [];
                      for await (const chunk of result.stream) {
                         const chunkText = chunk.text();
                         
                         // Extract grounding metadata (search results) if present
                         const groundingChunks = chunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
                         if (groundingChunks && Array.isArray(groundingChunks)) {
                            groundingChunks.forEach(gChunk => {
                               if (gChunk?.web?.uri && gChunk?.web?.title) {
                                  if (!sources.some(s => s.uri === gChunk.web.uri)) {
                                     sources.push(gChunk.web);
                                  }
                               }
                            });
                         }

                         controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
                      }
                      
                      // Append citations if any sources were found
                      if (sources.length > 0) {
                         let citationText = "\n\n---\n**Sumber Referensi:**\n";
                         sources.forEach((source, index) => {
                            citationText += `${index + 1}. [${source.title}](${source.uri})\n`;
                         });
                         controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: citationText })}\n\n`));
                      }

                      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                      controller.close();
                   } catch (err) {
                      controller.error(err);
                   }
                }
             });

             return new Response(stream, {
                headers: {
                   'Content-Type': 'text/event-stream',
                   'Cache-Control': 'no-cache, no-transform',
                   'Connection': 'keep-alive',
                   'X-Content-Type-Options': 'nosniff',
                   'Content-Encoding': 'none',
                }
             });
          } catch (e) {
             fallbackError += `Gemini Error; `;
          }
       }

       // 3. OPSI KETIGA: OPENROUTER (Fallback Terakhir jika Gemini error)
       if (sysConfig.engines?.openrouter !== false && process.env.OPENROUTER_API_KEY) {
          try {
             const messages = [{ role: 'system', content: sysInstruct }];
             for (const h of validHistory) messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.text });
             
             if (image) {
                 messages.push({
                    role: 'user',
                    content: [
                       { type: "text", text: message || "Apa yang ada di gambar ini?" },
                       { type: "image_url", image_url: { url: image } }
                    ]
                 });
             } else if (message) {
                 messages.push({ role: 'user', content: message });
             }

             const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'liquid/lfm-2.5-2.6b:free', messages: messages, stream: isStream, temperature: 0.7 })
             });
             
             if (response.ok) {
                if (!isStream) {
                   const data = await response.json();
                   return Response.json({ text: data.choices[0].message.content });
                }
                return buildOpenAIStreamResponse(response);
             } else {
                fallbackError += `OpenRouter Error (${response.status}); `;
             }
          } catch (e) {
             fallbackError += `OpenRouter Network Error; `;
          }
       }

       // JIKA SEMUA GAGAL, lempar error ke frontend
       throw new Error(`Semua server AI sedang sibuk/down. Log: ${fallbackError}`);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors?.[0]?.message || 'Validation error' }, { status: 400 });
    }
    console.error("API Error:", error.message);
    return Response.json({ error: "Gagal memanggil API. Detail: " + error.message }, { status: 500 });
  }
}