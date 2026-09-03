'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, Users, Activity, Settings, ArrowLeft, Megaphone, Power, DollarSign, Trash2, Mail, Calendar, LogIn } from 'lucide-react';
import Link from 'next/link';

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sysConfig, setSysConfig] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const adminEmail = 'fery883099@gmail.com';

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/');
        return;
      }

      if (session.user.email !== adminEmail) {
        router.replace('/');
        return;
      }

      setIsAdmin(true);
      fetchConfig();
    };

    const getAuthHeaders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      };
    };

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config', { headers: await getAuthHeaders() });
        const data = await res.json();
        setSysConfig(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    const fetchUsers = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/users', { headers });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.users || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingUsers(false);
      }
    };

    checkAdmin();
  }, [router]);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  };

  const deleteUser = async (userId) => {
    if (!confirm("Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan!")) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ id: userId })
      });
      if (res.ok) {
        setUsersList(prev => prev.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert(`Gagal: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan");
    }
  };

  const updateConfig = async (newValues) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(newValues)
      });
      const data = await res.json();
      setSysConfig(data);
    } catch (e) {
      console.error(e);
    }
  };

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
          {/* Fitur 53: Token & Cost Calculator */}
          <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center gap-4 mb-4 text-green-400">
              <DollarSign size={28} />
              <h2 className="text-xl font-semibold text-white">Token & Estimasi Biaya</h2>
            </div>
            <p className="text-4xl font-bold">{sysConfig?.stats?.tokens.toLocaleString() || 0} <span className="text-sm font-normal text-gray-400">Tokens</span></p>
            <p className="text-xl text-yellow-500 mt-2 font-mono">${(sysConfig?.stats?.tokens * 0.000002).toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Estimasi biaya API global ($2 / 1M tokens)</p>
          </div>

          <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center gap-4 mb-4 text-blue-400">
              <Users size={28} />
              <h2 className="text-xl font-semibold text-white">Total Pengguna</h2>
            </div>
            <p className="text-4xl font-bold">{loadingUsers ? '...' : usersList.length}</p>
            <p className="text-sm text-gray-500 mt-2">Data real-time dari Supabase</p>
          </div>

          <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center gap-4 mb-4 text-purple-400">
              <Settings size={28} />
              <h2 className="text-xl font-semibold text-white">Status API</h2>
            </div>
            <p className="text-2xl font-bold text-green-500">Normal</p>
            <p className="text-sm text-gray-500 mt-2">Config Aktif</p>
          </div>
        </div>

        {/* Area Konten Tambahan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fitur 56: Global Broadcast */}
          <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-4 flex items-center gap-2"><Megaphone className="text-yellow-400" /> Global Broadcast</h3>
            <p className="text-sm text-gray-400 mb-4">
              Pesan ini akan muncul sebagai banner peringatan di bagian atas chat seluruh pengguna. Kosongkan untuk menghapus.
            </p>
            <div className="flex flex-col gap-3">
              <textarea
                value={sysConfig?.broadcast || ""}
                onChange={(e) => setSysConfig({ ...sysConfig, broadcast: e.target.value })}
                placeholder="Tulis pesan darurat atau pengumuman..."
                className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-yellow-500 h-24 resize-none"
              ></textarea>
              <button
                onClick={() => updateConfig({ broadcast: sysConfig?.broadcast })}
                className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors self-end"
              >
                Broadcast Sekarang
              </button>
            </div>
          </div>

          {/* Fitur 57: Kill Switch */}
          <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-4 flex items-center gap-2"><Power className="text-red-500" /> Kill Switch Engine AI</h3>
            <p className="text-sm text-gray-400 mb-4">
              Matikan atau nyalakan mesin AI tertentu secara real-time. Jika dimatikan, sistem akan melakukan fallback ke mesin lain.
            </p>

            <div className="space-y-4">
              {['gemini', 'groq', 'openrouter'].map(engine => (
                <div key={engine} className="flex justify-between items-center bg-[#2f2f2f] p-4 rounded-lg">
                  <span className="font-medium capitalize text-lg">{engine} API</span>
                  <button
                    onClick={() => {
                      const newState = !sysConfig?.engines?.[engine];
                      updateConfig({ engines: { [engine]: newState } });
                    }}
                    className={`w-14 h-7 rounded-full relative transition-colors ${sysConfig?.engines?.[engine] ? 'bg-green-500' : 'bg-red-500'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${sysConfig?.engines?.[engine] ? 'left-8' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabel Daftar Pengguna Terdaftar */}
        <div className="mt-10 bg-[#1e1e1e] rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-2xl font-bold flex items-center gap-2"><Users className="text-blue-400" /> Daftar Pengguna Terdaftar</h3>
            <p className="text-sm text-gray-400 mt-1">Daftar semua orang yang pernah mendaftar dan login di Athlos AI.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#2f2f2f] text-gray-300">
                <tr>
                  <th className="p-4 font-semibold text-sm">Email</th>
                  <th className="p-4 font-semibold text-sm">ID Pengguna</th>
                  <th className="p-4 font-semibold text-sm">Bergabung</th>
                  <th className="p-4 font-semibold text-sm">Terakhir Login</th>
                  <th className="p-4 font-semibold text-sm text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loadingUsers ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat data pengguna...</td></tr>
                ) : usersList.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada pengguna.</td></tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-[#252525] transition-colors">
                      <td className="p-4 font-medium flex items-center gap-2"><Mail size={16} className="text-gray-500" /> {u.email}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">{u.id}</td>
                      <td className="p-4 text-sm text-gray-400 flex items-center gap-1"><Calendar size={14} /> {new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <LogIn size={14} /> {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
