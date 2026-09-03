'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, Users, Activity, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const adminEmail = 'fery883099@gmail.com';

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Belum login, tendang ke halaman utama
        router.replace('/');
        return;
      }

      if (session.user.email !== adminEmail) {
        // Login tapi bukan admin, tendang ke halaman utama
        router.replace('/');
        return;
      }

      // Lolos verifikasi!
      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) return null; // Mencegah kedipan UI sebelum redirect

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="text-red-500" size={32} />
              Dapur Rahasia Admin
            </h1>
            <p className="text-gray-400 mt-1">Selamat datang, {adminEmail}. Ini adalah zona terlarang.</p>
          </div>
          <Link href="/" className="flex items-center gap-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft size={18} /> Kembali ke Aplikasi
          </Link>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center gap-4 mb-4 text-blue-400">
              <Users size={28} />
              <h2 className="text-xl font-semibold text-white">Total Pengguna</h2>
            </div>
            <p className="text-4xl font-bold">1</p>
            <p className="text-sm text-gray-500 mt-2">Data dummy (belum terhubung ke DB)</p>
          </div>

          <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center gap-4 mb-4 text-green-400">
              <Activity size={28} />
              <h2 className="text-xl font-semibold text-white">Total Chat Hari Ini</h2>
            </div>
            <p className="text-4xl font-bold">0</p>
            <p className="text-sm text-gray-500 mt-2">Data dummy (belum terhubung ke DB)</p>
          </div>

          <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center gap-4 mb-4 text-purple-400">
              <Settings size={28} />
              <h2 className="text-xl font-semibold text-white">Status API</h2>
            </div>
            <p className="text-2xl font-bold text-green-500">Normal</p>
            <p className="text-sm text-gray-500 mt-2">Gemini API Aktif</p>
          </div>
        </div>

        {/* Area Konten Tambahan */}
        <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 p-8 shadow-lg">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-4">Pengaturan Sistem (Segera Hadir)</h3>
          <p className="text-gray-400 leading-relaxed">
            Halaman ini saat ini sudah dikunci rapat. Tidak ada orang yang bisa mengakses halaman ini selain Anda (fery883099@gmail.com). 
            Nantinya, kita bisa menyambungkan halaman ini untuk menarik data riil dari Supabase agar Anda bisa melihat semua aktivitas pengguna.
          </p>
        </div>

      </div>
    </div>
  );
}
