import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function GET(req) {
  if (!serviceKey) return NextResponse.json({ messages: [] });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || user.email !== 'fery883099@gmail.com') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ambil 20 pesan terakhir dari tabel messages (khusus role user)
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('id, content, created_at, chat_id')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ messages: data || [] });
  } catch (error) {
    console.error("Gagal mengambil data spy:", error.message);
    return NextResponse.json({ messages: [] });
  }
}
