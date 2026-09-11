'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Athlos AI caught runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#161312] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[#FFBE98]/10 border border-[#FFBE98]/30 flex items-center justify-center text-[#FFBE98] mb-4 shadow-[0_0_30px_rgba(255,190,152,0.15)]">
        <i className="bx bx-error-circle text-3xl"></i>
      </div>
      <h2 className="text-2xl font-bold mb-2">Terjadi Kendala Memuat Halaman</h2>
      <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
        Sistem mendeteksi kendala pada sesi ini. Silakan muat ulang atau kembali ke beranda obrolan.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,190,152,0.3)] flex items-center gap-2"
        >
          <i className="bx bx-refresh text-lg"></i> Coba Muat Ulang
        </button>
        <Link
          href="/chat"
          className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all flex items-center gap-2"
        >
          <i className="bx bx-chat text-lg"></i> Obrolan Baru
        </Link>
      </div>
    </div>
  );
}
