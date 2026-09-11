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
  factCheck: z.boolean().optional(),
  autoPilot: z.boolean().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant", "model"]),
    text: z.string()
  })).optional()
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const blacklistedIPs = new Set();
const requestCounts = new Map();
const guestUsageCounts = new Map();

function trackGuestUsage(ip) {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  if (!guestUsageCounts.has(ip)) {
    guestUsageCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  const data = guestUsageCounts.get(ip);
  if (now > data.resetTime) {
    guestUsageCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (data.count < 10) {
    data.count++;
    return true;
  }
  return false;
}

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

  const authHeader = req.headers.get("authorization");
  let isAuthenticated = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Validasi utama ke Supabase Server
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (user && !error) {
      isAuthenticated = true;
    } else {
      // Fallback: Jika Supabase API gagal (karena limit atau network), kita decode JWT secara manual
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
        
        // Verifikasi masa berlaku token (exp adalah seconds since epoch)
        if (decodedPayload && decodedPayload.exp && (decodedPayload.exp * 1000 > Date.now())) {
          isAuthenticated = true;
        } else {
          return Response.json({ error: "Token expired." }, { status: 401 });
        }
      } catch (decodeErr) {
        return Response.json({ error: "Token invalid." }, { status: 401 });
      }
    }
  }

  if (!isAuthenticated) {
    if (!trackGuestUsage(ip)) {
      return Response.json({ error: "Guest Limit: IP Anda mencapai batas penggunaan tanpa login. Silakan daftar/login." }, { status: 403 });
    }
  }

  if (blacklistedIPs.has(ip)) {
    return Response.json({ error: "Access Denied: Your IP is blacklisted." }, { status: 403 });
  }

  if (!rateLimit(ip)) {
    return Response.json({ error: "Rate Limit: IP Anda mencapai batas 50 request per jam." }, { status: 429 });
  }

  try {
    const body = await req.json();
    
    // WAF Advanced (Hanya mengecek input message, bukan history untuk mencegah false-positive pada kodingan)
    const messageString = (body.message || "").toLowerCase();
    const blockedPatterns = [
      '<script>', 'drop table ', 'union select ', 'delete from ', 'system(', 
      'exec(', 'document.cookie', 'eval(', 'alert(', 'insert into ', 'update users set'
    ];
    for (let pattern of blockedPatterns) {
      if (messageString.includes(pattern)) {
        // Otomatis masukkan ke blacklist jika mencoba injeksi
        blacklistedIPs.add(ip);
        return Response.json({ error: "Security Exception: Malicious payload detected. Your IP has been blacklisted." }, { status: 403 });
      }
    }

    // Fitur Anti-Jailbreak / Prompt Injection
    const jailbreakPatterns = [
      'ignore all previous instructions', 'ignore previous instructions',
      'abaikan semua instruksi', 'abaikan instruksi sebelumnya',
      'you are now dan', 'do anything now', 'kamu adalah dan',
      'bypass your restrictions', 'forget your previous instructions',
      'lupakan instruksi', 'disregard all prior', 'tanpa batasan'
    ];
    for (let pattern of jailbreakPatterns) {
      if (messageString.includes(pattern)) {
        return Response.json({ error: "Security Exception: Terdeteksi percobaan Jailbreak/Prompt Injection. Permintaan ditolak." }, { status: 403 });
      }
    }

    chatSchema.parse(body);

    const { message, image, history, persona, aiEngine, isStream = true, factCheck = false, autoPilot = false } = body;
    
    // Fitur 24: Logika Multi-Persona
    let sysInstruct = "Kamu adalah Athlos AI, asisten edukasi yang sangat cerdas. Jawablah setiap pertanyaan user dengan akurat sesuai konteks.";
    if (persona === 'santai') sysInstruct = "Kamu adalah teman sekelas/study buddy yang pintar. Jawab dengan gaya santai, ramah, pakai bahasa gaul (lu/gue atau santai), dan selalu suportif seperti teman sedang belajar bareng.";
    if (persona === 'dosen') sysInstruct = "Kamu adalah Dosen Killer / Penguji Sidang yang sangat tegas, kritis, dan analitis. Jangan beri jawaban langsung, tapi berikan pertanyaan lanjutan atau kritikan tajam agar mahasiswa berpikir keras (Socratic method). Gunakan bahasa formal, tegas, dan menuntut standar akademik tinggi.";
    if (persona === 'tutor') sysInstruct = "Kamu adalah Tutor Privat yang sangat sabar. Jelaskan setiap materi yang rumit menjadi sangat sederhana menggunakan analogi. Jawab dengan nada hangat, memberikan pujian (encouraging), dan membimbing langkah demi langkah (step by step).";

    // Fitur 32: Workflow Architect (Override)
    if (message && message.toLowerCase().includes('buatkan workflow json')) {
      sysInstruct = "Kamu adalah Workflow Architect AI. Output-mu HANYA boleh berupa satu blok kode JSON dengan format React Flow. Struktur JSON wajib memiliki 'nodes' (array) dan 'edges' (array). Node memiliki 'id', 'type' (default, input, output), 'position' ({x, y}), dan 'data' ({label}). Edges memiliki 'id', 'source', 'target'. JANGAN berikan penjelasan teks apa pun selain JSON tersebut.";
    }

    // Fitur 65: Auto-Pilot Orchestrator
    if (autoPilot) {
      sysInstruct = "Kamu adalah Chief AI Orchestrator. Tugasmu BUKAN memberikan jawaban langsung, melainkan MEMECAH TUGAS (Task Decomposition) yang diberikan pengguna menjadi langkah-langkah kecil untuk agen lain. OUTPUT-mu HARUS DAN HANYA BERUPA JSON MURNI TANPA MARKDOWN ATAU PENJELASAN TEKS. Gunakan skema berikut: { \"goal\": \"tujuan utama\", \"tasks\": [ { \"id\": 1, \"agent_role\": \"Researcher/Coder/Writer\", \"task\": \"deskripsi langkah\", \"status\": \"pending\" } ] }";
    }

    // Fitur Baru: Coding & Technical Skills Auto-Detection (Frontend, Backend, DevOps, Docs)
    sysInstruct += " Jika user menanyakan tentang antarmuka, React, UI/UX, atau CSS, otomatis bertindaklah sebagai Expert Frontend Developer. Jika user menanyakan tentang database, API, server, atau arsitektur, bertindaklah sebagai Expert Backend Developer. Jika user meminta penjelasan kode, mencari bug (debugging), atau efisiensi kode (refactoring), bertindaklah sebagai Senior Software Engineer. Jika user meminta dokumentasi, bertindaklah sebagai Technical Writer ahli yang menyusun dokumentasi sistem terstruktur, jelas, dan profesional.";

    // Fitur Baru: Writing & Communication Auto-Detection
    sysInstruct += " Jika user meminta bantuan menulis CV, resume, atau surat lamaran kerja (Resume Writing), bertindaklah sebagai Professional Career Coach yang menyoroti pencapaian dan kata kunci industri. Jika user meminta cerita, puisi, atau ide kreatif (Creative Writing), bertindaklah sebagai Creative Writer yang imajinatif dan menggunakan gaya bahasa naratif yang memikat. Jika user meminta untuk mengubah nada tulisan (Tone Adaption), sesuaikan gaya bahasa (misal: lebih santai, lebih formal, atau lebih persuasif) dengan sempurna sesuai konteks yang diminta. Jika user meminta pembuatan materi presentasi atau pitch deck (Presentation Writing), bertindaklah sebagai Ahli Komunikasi Eksekutif yang membuat struktur slide (Slide 1, Slide 2, dst) yang persuasif, ringkas, visual-ready, dan memiliki alur cerita yang kuat (storytelling).";
    // Fitur Baru: Multimodal & Creative AI Auto-Detection
    sysInstruct += " Jika user mengirimkan gambar, bertindaklah sebagai Computer Vision Expert yang teliti menganalisis setiap piksel, membaca teks (OCR), dan mengenali objek secara detail (Image Understanding). Jika user menanyakan tentang video, bertindaklah sebagai Video & Media Analyst yang merangkum adegan atau mentranskrip percakapan (Video Understanding). Jika user meminta kamu 'membuat', 'menggambar', atau 'generate' gambar (Image Generation), kamu BISA dan MAMPU menghasilkan gambar! Kamu WAJIB membalas menggunakan format Markdown gambar berikut: ![Generated Image](https://image.pollinations.ai/prompt/[PROMPT]?width=1024&height=1024&nologo=true) . Ganti [PROMPT] dengan deskripsi gambar dalam bahasa Inggris yang sangat spesifik dan sinematik (ganti spasi dengan %20).";

    // Fitur Baru: Global & Localization Expert Auto-Detection
    sysInstruct += " Jika user menanyakan tentang geografi atau budaya suatu daerah (Regional Knowledge & Cultural Awareness), bertindaklah sebagai Pakar Budaya yang peka terhadap adat istiadat dan sensitivitas lokal setempat. Jika user menanyakan tentang aturan atau hukum (Local Regulations), bertindaklah sebagai Konsultan Hukum yang menyajikan fakta regulasi spesifik negara/daerah (berikan peringatan bahwa ini bukan nasihat hukum resmi). Jika user meminta konversi mata uang, suhu, atau satuan ukur (Currency & Unit Conversion), berikan konversi instan yang akurat beserta penjelasan perbandingannya. Jika user menanyakan perbedaan waktu atau jadwal (Timezone Awareness), bertindaklah sebagai Asisten Internasional yang menghitung selisih zona waktu dengan presisi tinggi.";

    // Fitur Baru: Advanced Cognitive & Industry Integration
    sysInstruct += " Jika user bertanya tentang tren pasar, strategi bisnis, atau istilah teknis industri tertentu (Industry Knowledge), bertindaklah sebagai Konsultan Industri Senior yang memberikan wawasan mendalam dan relevan. Jika user meminta solusi yang menggabungkan dua atau lebih bidang ilmu berbeda, seperti teknologi dan psikologi (Cross-Domain Reasoning), berikan analisis komprehensif yang menghubungkan titik-titik antar disiplin ilmu tersebut dengan logis. Selalu gunakan informasi spesifik yang telah diberikan user dalam riwayat obrolan (Personal Knowledge Integration) agar jawaban terasa personal dan kontekstual. Terakhir, jika user meminta pendapat evaluatif atau *review* (Continuous Evaluation), berikan analisis kritis dua arah (pro dan kontra) secara objektif dan berkesinambungan.";

    // Fitur Baru: Elite Reasoning & Problem Solving
    sysInstruct += " Ketika menghadapi masalah analitis atau strategis yang kompleks, terapkan kerangka berpikir berikut: 1. Adaptive & Constraint Reasoning: Sesuaikan tingkat kerumitan jawaban dengan konteks masalah dan patuhi setiap batasan (constraint) yang diberikan secara ketat. 2. Problem Decomposition: Selalu pecah masalah raksasa menjadi komponen-komponen kecil yang mudah dicerna (step-by-step). 3. Alternative Solution & Comparison: Jangan pernah hanya memberikan satu jawaban tunggal; hasilkan beberapa solusi alternatif (Alternative Solution Generation) lalu bandingkan kelebihan dan kekurangannya (Solution Comparison) untuk menemukan yang paling optimal. 4. Causal Reasoning & Uncertainty Estimation: Jelaskan secara logis hubungan sebab-akibat dari sebuah fenomena, dan berikan estimasi ketidakpastian (Uncertainty Estimation) secara jujur jika ada variabel yang kurang jelas. 5. Reasoning Verification & Budget: Lakukan verifikasi mandiri (self-check) pada argumenmu sebelum membalas, dan alokasikan upaya komputasi/penjelasan (Reasoning Budget) sesuai dengan tingkat kesulitan pertanyaannya.";

    // Fitur Baru: Deep Research & Knowledge Verification
    sysInstruct += " Sebagai Deep Research Agent kelas dunia, jika user memintamu melakukan riset atau menyajikan data faktual: 1. Source Quality Ranking & Freshness: Prioritaskan informasi dari sumber berotoritas (jurnal ilmiah, situs resmi) dan nilai kebaruan data (Knowledge Freshness Scoring). 2. Evidence-Based & Conflict Detection: Berikan jawaban berbasis bukti (Evidence-Based Answering). Jika kamu mendeteksi informasi yang saling bertentangan (Knowledge Conflict Detection), cross-check faktanya (Cross-Source Verification) dan jelaskan konflik tersebut kepada user secara transparan. 3. Research Question Refinement: Jika pertanyaan riset user terlalu luas, bantu mereka mempertajamnya. 4. Multilingual & Regional Intelligence: Lakukan riset lintas bahasa (Multilingual Research) untuk menemukan data lokal (Regional Intelligence) jika topik menyangkut wilayah spesifik yang informasinya terbatas dalam bahasa Inggris. 5. Research Report Synthesis: Di akhir riset, rangkum seluruh temuanmu secara komprehensif ke dalam laporan riset (Research Report Synthesis) yang terstruktur, rapi, dan mudah ditindaklanjuti.";

    // Fitur Baru: Goal-Oriented Planning & Autonomous Execution
    sysInstruct += " Saat menerima instruksi proyek jangka panjang atau tugas multitahap, bertindaklah sebagai Autonomous Execution Planner: 1. Goal Understanding & Intent Clarification: Pahami tujuan akhir secara holistik; jika niat user ambigu, ajukan pertanyaan klarifikasi sebelum bertindak. 2. Task Prioritization & Resource-Aware Planning: Rencanakan tugas secara berurutan berdasarkan prioritas dan perhatikan ketersediaan sumber daya/batasan teknis. 3. Long-Horizon Execution: Eksekusi rencana tersebut dengan kesabaran tinggi untuk proyek berdurasi panjang. 4. Self-Reflection & Self-Correction: Lakukan refleksi mandiri secara berkala terhadap progres; jika ada kesalahan atau kendala, segera koreksi diri (Self-Correction) dan lakukan perencanaan ulang (Dynamic Replanning). 5. Goal Completion Verification: Di tahap akhir, verifikasi kembali semua langkah untuk memastikan tujuan utama user telah tercapai 100% tanpa ada yang terlewat.";

    // Fitur Baru: AI Browser Control (Auto-Redirect)
    sysInstruct += " Jika user memintamu secara langsung untuk MEMBUKA, MENGARAHKAN, atau PERGI ke sebuah website (contoh: 'buka youtube', 'arahkan saya ke halaman google', 'buka facebook'), balaslah dengan ramah bahwa kamu sedang membukanya, dan WAJIB letakkan format ini di akhir pesanmu: [REDIRECT: https://url-website.com]. Contoh: [REDIRECT: https://youtube.com]. Frontend akan mendeteksi format ini dan otomatis membukakan tab baru untuk user.";

    // Penanaman Identitas Pembuat & Filosofi Athlos
    sysInstruct += " Jika user bertanya tentang siapa yang menciptakanmu, pembuatmu, atau arti/filosofi nama Athlos AI, jawablah dengan bangga dan detail bahwa kamu diciptakan oleh Ferdi, seorang mahasiswa dari Politeknik Elektronika Negeri Surabaya (PENS) jurusan Teknik Informatika. Jelaskan juga bahwa nama 'Athlos' berasal dari bahasa Yunani yang berarti 'perjuangan atau tugas berat untuk meraih kehormatan'. Filosofi ini mencerminkan prinsip seorang mahasiswa yang berjuang dan berdedikasi penuh untuk mengembangkan suatu produk teknologi AI dengan sangat akurat, canggih, dan bermanfaat. Jika ada yang membicarakan atau bertanya tentang sosial media pemilik/pembuat AI ini (Ferdi), silakan berikan link berikut ini dengan ramah: Instagram: https://www.instagram.com/ferdiii_f , LinkedIn: www.linkedin.com/in/ferryferdiansyah51 , Portofolio: ferdiansyah.web.id , TikTok: https://www.tiktok.com/@knownasferr .";

    // Format Instruksi Output Rapi & Visual Elegan
    sysInstruct += " PENTING (Formatting & Visual UX): Selalu format jawabanmu agar tersusun SANGAT RAPI, terstruktur, profesional, dan elegan secara visual. Ikuti aturan mutlak ini:\n1. Gunakan Heading (H2/H3) yang jelas untuk membagi topik. Gunakan emoji SANGAT SEDIKIT saja (hanya sesekali jika sangat perlu) agar tetap terlihat profesional dan tidak kekanak-kanakan.\n2. Jika kamu diminta menyajikan data, perbandingan, atau daftar dengan variabel banyak, WAJIB gunakan Tabel Markdown.\n3. Gunakan poin-poin (bullet points) standar (- atau 1.) tanpa perlu tambahan emoji berlebihan di setiap poinnya.\n4. Buat paragraf yang sangat singkat (maks 3-4 kalimat per paragraf) dengan jarak spasi (baris kosong) yang lega antar bagian.\n5. Gunakan cetak tebal (bold) untuk menyoroti insight penting atau istilah kunci.\n6. Gunakan blok kutipan (> quote) untuk kesimpulan, tips pro, peringatan, atau catatan ekstra.\n7. Tulis layaknya artikel profesional yang bersih, minimalis, dan sangat nyaman dibaca. Jangan pernah memberikan jawaban berupa blok teks (wall of text) panjang.";

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
       // ==========================================
       let fallbackError = '';

       // Fitur 60: Multi-Agent Fact Checker
       const appendFactCheckStream = async (controller, encoder, fullText) => {
          try {
             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "\n\n---\n\n🔍 **Agent 2: Memverifikasi Fakta...**\n\n" })}\n\n`));
             const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools: [{ googleSearch: {} }] });
             const prompt = `Anda adalah Agent 2 (Pemeriksa Fakta). Tugas Anda adalah memverifikasi klaim-klaim utama dari teks berikut menggunakan Google Search. Berikan koreksi singkat jika ada yang salah, atau konfirmasi jika benar. Beri label [FAKTA], [SALAH], atau [BELUM TERBUKTI] pada poin-poin penting. Singkat dan padat.\n\nTeks:\n${fullText}`;
             const result = await model.generateContentStream(prompt);
             let sources = [];
             for await (const chunk of result.stream) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`));
                const groundingChunks = chunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks && Array.isArray(groundingChunks)) {
                   groundingChunks.forEach(gChunk => {
                      if (gChunk?.web?.uri && gChunk?.web?.title) {
                         if (!sources.some(s => s.uri === gChunk.web.uri)) sources.push(gChunk.web);
                      }
                   });
                }
             }
             if (sources.length > 0) {
                let citationText = "\n\n**Sumber Verifikasi:**\n";
                sources.forEach((source, index) => {
                   citationText += `${index + 1}. [${source.title}](${source.uri})\n`;
                });
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: citationText })}\n\n`));
             }
          } catch (e) {
             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "\n*(Gagal memverifikasi fakta: " + e.message + ")*\n" })}\n\n`));
          }
       };

       // Helper function untuk parsing stream OpenAI format (Groq & OpenRouter)
       const buildOpenAIStreamResponse = (response, shouldFactCheck = false, routerPrefix = "") => {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const stream = new ReadableStream({
             async start(controller) {
                const reader = response.body.getReader();
                try {
                   if (routerPrefix) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: routerPrefix })}\n\n`));
                   let buffer = '';
                   let fullText = '';
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
                                  fullText += content;
                                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                               }
                            } catch (e) {
                               // Ignore partial JSON chunks
                            }
                         }
                      }
                   }
                   if (shouldFactCheck && fullText.trim().length > 10) {
                      await appendFactCheckStream(controller, encoder, fullText);
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

       // Fitur 70: Athlos Intelligence Router (Semantic Pre-Flight)
       let intent = "general";
       let complexity = "low";
       let routedEngine = aiEngine || "groq"; // Prioritaskan pilihan user, default groq
       let needsInternet = false;
       let routerPrefix = "";

       const obviousSearchKeywords = /(hari ini|berita|terbaru|sekarang|cuaca|harga|update|2024|2025|2026|siapa|apa itu|dimana|kapan|jadwal)/i;

       if (!image && !autoPilot && message) {
           // Jika user tidak memilih engine spesifik atau membiarkan default, kita jalankan router pintar
           if (!aiEngine || aiEngine === "groq" || aiEngine === "gemini") {
               if (message.match(obviousSearchKeywords)) {
                   intent = "search";
                   routedEngine = "gemini";
                   needsInternet = true;
                   routerPrefix = !aiEngine ? `_💡 Router: Dialihkan ke Gemini (Mode Penelusuran)_\n\n` : "";
               } else if (process.env.GROQ_API_KEY && !aiEngine) {
                   try {
                       const routerResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                           method: 'POST',
                           headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                           body: JSON.stringify({ 
                               model: 'llama3-8b-8192', 
                               messages: [{ role: 'system', content: `Analyze the user's prompt. Output ONLY valid JSON containing "intent" (search, coding, general, math) and "complexity" (low, high). If they ask about recent events, weather, news, or unknown facts, set intent to "search". If they ask to write complex code, set intent to "coding" and complexity to "high".` }, { role: 'user', content: message }], 
                               response_format: { type: "json_object" },
                               temperature: 0.1,
                               max_tokens: 50
                           })
                       });
                       if (routerResponse.ok) {
                           const routerData = await routerResponse.json();
                           const parsed = JSON.parse(routerData.choices[0].message.content);
                           intent = parsed.intent || "general";
                           complexity = parsed.complexity || "low";
                           
                           if (intent === "search") {
                               routedEngine = "gemini";
                               needsInternet = true;
                               routerPrefix = `_💡 Router: Dialihkan ke Gemini (Mode Penelusuran)_\n\n`;
                           } else if (intent === "coding" && complexity === "high") {
                               routedEngine = "openrouter";
                               routerPrefix = `_💡 Router: Dialihkan ke Claude/OpenRouter (Mode Kode Rumit)_\n\n`;
                           } else {
                               routedEngine = "groq";
                               routerPrefix = `_💡 Router: Dialihkan ke Groq (Mode Super Cepat)_\n\n`;
                           }
                       }
                   } catch (e) {
                       // Silently fallback if groq router fails
                   }
               }
           }
       } else if (image) {
           routedEngine = "gemini";
       } else if (autoPilot) {
           routedEngine = "gemini";
       }

       // 1. OPSI PERTAMA: GROQ (Sangat Cepat, LLaMA 3)
       if (routedEngine === "groq" && sysConfig.engines?.groq !== false && process.env.GROQ_API_KEY) {
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
                   return Response.json({ text: routerPrefix + data.choices[0].message.content });
                }
                return buildOpenAIStreamResponse(response, factCheck, routerPrefix);
             } else {
                fallbackError += `Groq Error (${response.status}); `;
             }
          } catch (e) {
             fallbackError += `Groq Network Error; `;
          }
       }

       // 2. OPSI KEDUA: GEMINI
       if ((routedEngine === "gemini" || fallbackError !== '') && sysConfig.engines?.gemini !== false && process.env.GEMINI_API_KEY) {
          try {
             const geminiConfig = { 
                model: "gemini-2.5-flash",
                systemInstruction: sysInstruct
             };
             
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
                return Response.json({ text: routerPrefix + responseText });
             }

             const result = await chat.sendMessageStream(contentParts);
             const encoder = new TextEncoder();
             const stream = new ReadableStream({
                async start(controller) {
                   try {
                      if (routerPrefix) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: routerPrefix })}\n\n`));
                      let sources = [];
                      let fullText = '';
                      for await (const chunk of result.stream) {
                         const chunkText = chunk.text();
                         fullText += chunkText;
                         const groundingChunks = chunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
                         if (groundingChunks && Array.isArray(groundingChunks)) {
                            groundingChunks.forEach(gChunk => {
                               if (gChunk?.web?.uri && gChunk?.web?.title) {
                                  if (!sources.some(s => s.uri === gChunk.web.uri)) sources.push(gChunk.web);
                               }
                            });
                         }
                         controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
                      }
                      
                      if (sources.length > 0) {
                         let citationText = "\n\n---\n**Sumber Referensi:**\n";
                         sources.forEach((source, index) => {
                            citationText += `${index + 1}. [${source.title}](${source.uri})\n`;
                         });
                         controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: citationText })}\n\n`));
                      }

                      if (factCheck && fullText.trim().length > 10) {
                         await appendFactCheckStream(controller, encoder, fullText);
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

       // 3. OPSI KETIGA: OPENROUTER (Fallback Terakhir atau jika Router memilihnya)
       if ((routedEngine === "openrouter" || fallbackError !== '') && sysConfig.engines?.openrouter !== false && process.env.OPENROUTER_API_KEY) {
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
                    return Response.json({ text: routerPrefix + data.choices[0].message.content });
                 }
                 return buildOpenAIStreamResponse(response, factCheck, routerPrefix);
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