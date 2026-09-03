import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Pastikan Service Role Key tersedia, jika tidak fitur admin tidak akan bekerja
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET() {
  if (!serviceKey) {
    return NextResponse.json({ error: "Service Role Key tidak dikonfigurasi" }, { status: 500 });
  }

  try {
    // Memanggil API Admin Supabase untuk mengambil daftar semua pengguna
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;
    
    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Gagal mengambil data user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!serviceKey) {
    return NextResponse.json({ error: "Service Role Key tidak dikonfigurasi" }, { status: 500 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID user diperlukan" }, { status: 400 });

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
