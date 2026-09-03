import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Pastikan Service Role Key tersedia
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEFAULT_CONFIG = {
  broadcast: "",
  engines: { gemini: true, groq: true, openrouter: true },
  stats: { tokens: 0, cost: 0 }
};

export async function GET() {
  if (!serviceKey) return NextResponse.json(DEFAULT_CONFIG);

  try {
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('config')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_CONFIG);
    }
    return NextResponse.json(data.config);
  } catch (error) {
    console.error("Gagal mengambil config:", error.message);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

export async function POST(req) {
  if (!serviceKey) {
    return NextResponse.json({ error: "Service Role Key tidak dikonfigurasi" }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    // Ambil config saat ini dulu
    const { data: currentData } = await supabaseAdmin
      .from('system_config')
      .select('config')
      .eq('id', 1)
      .single();

    const config = currentData?.config || DEFAULT_CONFIG;
    
    // Merge nested objects properly
    const newConfig = { ...config, ...body };
    if (body.engines) newConfig.engines = { ...config.engines, ...body.engines };
    if (body.stats) newConfig.stats = { ...config.stats, ...body.stats };

    const { error } = await supabaseAdmin
      .from('system_config')
      .update({ config: newConfig })
      .eq('id', 1);

    if (error) throw error;

    return NextResponse.json(newConfig);
  } catch (error) {
    console.error("Gagal update config:", error.message);
    return NextResponse.json({ error: "Gagal update config" }, { status: 500 });
  }
}
