import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fungsi untuk memotong teks menjadi bagian-bagian kecil (chunking)
function chunkText(text, maxChunkSize = 1000) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length > maxChunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = word.length;
    } else {
      currentChunk.push(word);
      currentLength += word.length + 1; // +1 for space
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  return chunks;
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized user' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !file.name.endsWith('.pdf')) {
      return Response.json({ error: 'File must be a valid PDF' }, { status: 400 });
    }

    // 1. Baca isi PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let parsedData;
    try {
      parsedData = await pdfParse(buffer);
    } catch (e) {
      console.error("PDF Parse error", e);
      return Response.json({ error: 'Gagal membaca PDF. Pastikan file tidak dienkripsi/rusak.' }, { status: 500 });
    }

    const rawText = parsedData.text || '';
    if (rawText.trim().length < 10) {
      return Response.json({ error: 'PDF kosong atau isinya tidak bisa dibaca (gambar hasil scan).' }, { status: 400 });
    }

    // 2. Simpan metadata dokumen ke Supabase
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({ user_id: user.id, filename: file.name })
      .select()
      .single();

    if (docError || !docData) {
      console.error("Doc Error", docError);
      return Response.json({ error: 'Gagal menyimpan dokumen ke database' }, { status: 500 });
    }

    // 3. Lakukan Chunking Text
    const chunks = chunkText(rawText, 1000); // 1000 karakter per chunk
    
    // 4. Generate Embeddings & Simpan ke Supabase
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    let insertedChunks = 0;

    for (const chunk of chunks) {
      try {
        const result = await embeddingModel.embedContent(chunk);
        const embedding = result.embedding.values;

        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: docData.id,
            content: chunk,
            embedding: embedding
          });
        
        if (!chunkError) insertedChunks++;
      } catch (e) {
        console.warn("Gagal embed chunk:", e.message);
      }
    }

    return Response.json({ 
      success: true, 
      documentId: docData.id, 
      chunksProcessed: insertedChunks 
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    return Response.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
