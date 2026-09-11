'use client';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ViralShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://athlos.web.id';
  const shareText = `🔥 Cobain Athlos AI! Asisten AI Indonesia super pintar dengan Deep Reasoning & Image Generator Flux. 100% GRATIS tanpa limit kuota karya mahasiswa PENS:\n👉 ${siteUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    toast.success('Link Athlos AI berhasil disalin!', { icon: '🔗' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#1c1817] border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Tutup"
        >
          <i className="bx bx-x text-xl"></i>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#FFBE98] to-[#F9A48C] flex items-center justify-center shadow-[0_0_25px_rgba(255,190,152,0.4)]">
            <i className="bx bx-share-alt text-2xl text-[#201B1A]"></i>
          </div>
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
            Bagikan Athlos AI
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Bantu teman, keluarga, dan mahasiswa lain mengakses AI cerdas secara gratis tanpa limit!
          </p>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            onClick={handleShareWhatsApp}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] transition-all hover:scale-105 active:scale-95"
          >
            <i className="bx bxl-whatsapp text-2xl mb-1"></i>
            <span className="text-[11px] font-semibold">WhatsApp</span>
          </button>

          <button
            onClick={handleShareTwitter}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all hover:scale-105 active:scale-95"
          >
            <i className="bx bxl-twitter text-2xl mb-1"></i>
            <span className="text-[11px] font-semibold">X (Twitter)</span>
          </button>

          <button
            onClick={handleShareLinkedIn}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0077B5]/10 hover:bg-[#0077B5]/20 border border-[#0077B5]/30 text-[#0A66C2] transition-all hover:scale-105 active:scale-95"
          >
            <i className="bx bxl-linkedin text-2xl mb-1"></i>
            <span className="text-[11px] font-semibold">LinkedIn</span>
          </button>
        </div>

        {/* Copy Link Input */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-2 pl-3 flex items-center gap-2 mb-4">
          <i className="bx bx-link text-gray-400"></i>
          <input
            type="text"
            readOnly
            value={siteUrl}
            className="bg-transparent text-xs text-gray-300 flex-1 outline-none font-mono"
          />
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
        </div>

        {/* Badge Gratis Anti Limit */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            100% Gratis & Anti-Limit untuk Publik
          </span>
        </div>
      </div>
    </div>
  );
}
