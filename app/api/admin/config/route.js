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

export async function GET(req) {
  if (!serviceKey) return NextResponse.json(DEFAULT_CONFIG);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || user.email !== 'fery883099@gmail.com') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || user.email !== 'fery883099@gmail.com') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
