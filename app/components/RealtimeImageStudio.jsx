'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const STYLES = [
  { id: 'none', label: 'Alami (Raw)', icon: 'bx-reset', suffix: '' },
  { id: 'photo', label: 'Fotorealistik 8K', icon: 'bx-camera', suffix: ', 8k resolution, photorealistic, cinematic lighting, highly detailed, sharp focus, 35mm lens' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: 'bx-planet', suffix: ', cyberpunk style, neon lights, night city reflections, futuristic aesthetic, hyperdetailed' },
  { id: 'anime', label: 'Anime / Ghibli', icon: 'bx-brush', suffix: ', anime art style, makoto shinkai vibe, vibrant saturated colors, scenic masterpiece' },
  { id: '3d', label: '3D Pixar Animation', icon: 'bx-cube', suffix: ', 3d animated character style, pixar disney aesthetic, smooth textures, cute, raytracing octane render' },
  { id: 'fantasy', label: 'Dark Fantasy', icon: 'bx-ghost', suffix: ', dark fantasy concept art, mystical ethereal glow, intricate details, epic cinematic atmosphere' },
  { id: 'pixel', label: 'Retro Pixel Art', icon: 'bx-grid-alt', suffix: ', 16-bit pixel art, retro gaming aesthetic, vibrant colors, sharp pixel outlines' },
  { id: 'scifi', label: 'Sci-Fi Futuristic', icon: 'bx-chip', suffix: ', sci-fi concept art, high-tech spaceship interior, holographic interfaces, futuristic' }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Persegi', width: 1024, height: 1024, icon: 'bx-square-rounded' },
  { id: '16:9', label: '16:9 Lanskap', width: 1280, height: 720, icon: 'bx-rectangle' },
  { id: '9:16', label: '9:16 Story/Reels', width: 720, height: 1280, icon: 'bx-mobile' },
  { id: '4:3', label: '4:3 Standar', width: 1024, height: 768, icon: 'bx-windows' }
];

const INSPIRATIONS = [
  "Cyberpunk cat with glowing neon glasses on a rain-slicked Tokyo street",
  "Futuristic electric sports car drifting on a neon highway at midnight",
  "Cozy coffee shop in the forest with floating lanterns and warm rain outside",
  "Majestic celestial dragon flying above snowy mountains under the aurora borealis",
  "Miniature astronaut discovering a glowing crystal cave inside an alien bonsai tree"
];

export default function RealtimeImageStudio({
  isOpen,
  onClose,
  initialPrompt = '',
  initialReferencePhoto = null,
  onSendToChat,
  onUseAsInput
}) {
  const [prompt, setPrompt] = useState(initialPrompt || 'Futuristic robot barista making coffee in a cozy cyber cafe');
  const [debouncedPrompt, setDebouncedPrompt] = useState(prompt);
  const [selectedStyle, setSelectedStyle] = useState('photo');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [history, setHistory] = useState([]);
  const [referencePhoto, setReferencePhoto] = useState(initialReferencePhoto);

  const debounceTimerRef = useRef(null);

  // Debounce input prompt teks (450ms untuk feel realtime tanpa lag)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedPrompt(prompt);
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [prompt]);

  // Generate Image URL function
  const generateUrl = useCallback((pText, styleId, ratioId, currentSeed) => {
    if (!pText.trim()) return '';
    const styleObj = STYLES.find(s => s.id === styleId) || STYLES[0];
    const ratioObj = ASPECT_RATIOS.find(r => r.id === ratioId) || ASPECT_RATIOS[0];

    const fullPrompt = `${pText.trim()}${styleObj.suffix}`;
    const encodedPrompt = encodeURIComponent(fullPrompt);

    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioObj.width}&height=${ratioObj.height}&seed=${currentSeed}&model=turbo&nologo=true`;
  }, []);

  const targetUrl = generateUrl(debouncedPrompt, selectedStyle, aspectRatio, seed);
  const isGenerating = Boolean(isOpen && targetUrl && targetUrl !== currentImageUrl);

  // Effect untuk trigger generator setiap kali parameter berubah secara realtime
  useEffect(() => {
    if (!isOpen || !debouncedPrompt.trim() || !targetUrl) return;

    // Preload image in memory agar tidak berkedip putih saat pergantian render
    const img = new Image();
    img.src = targetUrl;
    img.onload = () => {
      setCurrentImageUrl(targetUrl);
      setHistory(prev => {
        if (prev.includes(targetUrl)) return prev;
        return [targetUrl, ...prev.slice(0, 9)];
      });
    };
  }, [isOpen, debouncedPrompt, targetUrl]);

  // Tombol acak seed (Dadu)
  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  // Pilih inspirasi acak
  const pickRandomInspiration = () => {
    const random = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
    setPrompt(random);
  };

  // Unduh Gambar Langsung
  const downloadImage = async () => {
    if (!currentImageUrl) return;
    try {
      toast.loading('Menyiapkan unduhan...', { id: 'download-img' });
      const res = await fetch(currentImageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `athlos-ai-art-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Gambar berhasil diunduh!', { id: 'download-img' });
    } catch {
      toast.error('Gagal mengunduh gambar.', { id: 'download-img' });
    }
  };

  // Salin Link Gambar
  const copyImageUrl = () => {
    if (!currentImageUrl) return;
    navigator.clipboard.writeText(currentImageUrl);
    toast.success('URL Gambar disalin ke clipboard!');
  };

  // Kirim ke percakapan chat aktif
  const handleSendToChat = () => {
    if (!currentImageUrl) return;
    if (onSendToChat) {
      onSendToChat(currentImageUrl, prompt);
      toast.success('Gambar disematkan ke percakapan chat!');
      onClose();
    }
  };

  // Pakai sebagai input (attachment)
  const handleUseAsInput = () => {
    if (!currentImageUrl) return;
    if (onUseAsInput) {
      onUseAsInput(currentImageUrl);
      toast.success('Gambar dipasang sebagai lampiran chat!');
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentRatioObj = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <div className="fixed inset-0 z-[75] bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#181413] border border-[#FFBE98]/30 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative">

        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#201B1A]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FFBE98] to-[#F9A48C] flex items-center justify-center text-[#201B1A]">
              <i className="bx bx-palette text-xl font-bold"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base leading-tight">Studio Gambar Real-time Athlos</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> LIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Ketikkan imajinasi Anda dan lihat visual berubah seketika
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={pickRandomInspiration}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 transition-colors"
              title="Coba Ide Acak"
            >
              <i className="bx bx-bulb text-yellow-400"></i> Inspirasi Acak
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Tutup Studio"
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Main Content Layout: Split View (Controls Left / Canvas Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

          {/* Left Controls Column (Scrollable) */}
          <div className="w-full lg:w-[420px] p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 shrink-0 bg-[#161312]/60">

            {/* Reference Photo banner if passed from Camera */}
            {referencePhoto && (
              <div className="p-2.5 rounded-2xl bg-[#26201e] border border-[#FFBE98]/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img src={referencePhoto} alt="Ref Foto" className="w-12 h-12 object-cover rounded-xl border border-white/20" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#FFBE98] tracking-wider block">Foto Terlampir</span>
                    <span className="text-xs text-gray-300">Gunakan sebagai inspirasi gaya</span>
                  </div>
                </div>
                <button
                  onClick={() => setReferencePhoto(null)}
                  className="text-gray-500 hover:text-red-400 p-1"
                  title="Hapus Referensi"
                >
                  <i className="bx bx-trash text-lg"></i>
                </button>
              </div>
            )}

            {/* Prompt Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <i className="bx bx-edit text-[#FFBE98]"></i> Prompt Deskripsi Gambar:
                </label>
                <span className="text-[10px] text-gray-500 font-mono">{prompt.length} karakter</span>
              </div>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Deskripsikan gambar yang ingin dibuat..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/15 focus:border-[#FFBE98]/60 focus:bg-white/10 rounded-2xl p-3 text-sm text-white placeholder-gray-500 outline-none transition-all resize-none shadow-inner leading-relaxed"
                />
                {prompt && (
                  <button
                    onClick={() => setPrompt('')}
                    className="absolute right-2.5 bottom-3 text-gray-500 hover:text-white p-1"
                    title="Kosongkan prompt"
                  >
                    <i className="bx bx-x-circle text-base"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Style Selector Chips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <i className="bx bx-paint-roll text-[#FFBE98]"></i> Gaya Visual:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all border ${
                      selectedStyle === style.id
                        ? 'bg-gradient-to-r from-[#FFBE98]/20 to-[#F9A48C]/10 border-[#FFBE98] text-white shadow-[0_0_12px_rgba(255,190,152,0.2)] font-semibold'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className={`bx ${style.icon} text-base ${selectedStyle === style.id ? 'text-[#FFBE98]' : 'text-gray-400'}`}></i>
                    <span className="truncate">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <i className="bx bx-aspect-ratio text-[#FFBE98]"></i> Rasio Aspek:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] transition-all border ${
                      aspectRatio === ratio.id
                        ? 'bg-[#FFBE98]/20 border-[#FFBE98] text-white font-semibold'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className={`bx ${ratio.icon} text-lg mb-0.5 ${aspectRatio === ratio.id ? 'text-[#FFBE98]' : ''}`}></i>
                    <span>{ratio.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seed & Variations */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <i className="bx bx-dice-5 text-[#FFBE98]"></i> Variasi Acak (Seed):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-white/5 border border-white/15 focus:border-[#FFBE98]/60 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
                <button
                  onClick={randomizeSeed}
                  className="px-3 py-2 bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] font-bold rounded-xl text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_rgba(255,190,152,0.3)] flex items-center gap-1.5"
                  title="Acak Seed untuk variasi baru"
                >
                  <i className="bx bx-shuffle text-base"></i> Acak Dadu
                </button>
              </div>
            </div>

            {/* Recent History Thumbs */}
            {history.length > 1 && (
              <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Riwayat Variasi Sesi Ini</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {history.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageUrl(url)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border transition-all ${
                        currentImageUrl === url ? 'border-[#FFBE98] scale-105 shadow-[0_0_10px_#FFBE98]' : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`History ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Live Canvas Viewport */}
          <div className="flex-1 flex flex-col bg-black/50 overflow-hidden relative">

            {/* Viewport Canvas Container */}
            <div className="flex-1 p-4 sm:p-6 flex items-center justify-center overflow-hidden relative">

              {currentImageUrl ? (
                <div
                  className={`relative max-w-full max-h-full rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
                    isGenerating ? 'border-[#FFBE98] shadow-[0_0_30px_rgba(255,190,152,0.4)]' : 'border-white/15'
                  }`}
                  style={{
                    aspectRatio: `${currentRatioObj.width} / ${currentRatioObj.height}`
                  }}
                >
                  <img
                    src={currentImageUrl}
                    alt="AI Render Realtime"
                    className="w-full h-full object-contain max-h-[550px] bg-[#1a1615]"
                  />

                  {/* Pulsing overlay when new image is generating */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center gap-2 text-white animate-pulse">
                      <div className="p-3 rounded-2xl bg-black/70 border border-[#FFBE98]/50 flex items-center gap-2 text-xs font-semibold text-[#FFBE98]">
                        <i className="bx bx-loader-alt bx-spin text-lg"></i>
                        <span>Memperbarui Visual...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm text-gray-500">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-[#FFBE98]">
                    <i className="bx bx-image-alt text-3xl"></i>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">Kanvas Real-time Kosong</h4>
                  <p className="text-xs">Tuliskan deskripsi gambar di sebelah kiri untuk melihat keajaiban visual terbentuk.</p>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 sm:p-4 bg-[#1e1918]/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadImage}
                  disabled={!currentImageUrl}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  title="Unduh file HD"
                >
                  <i className="bx bx-download text-base"></i> Unduh HD
                </button>
                <button
                  onClick={copyImageUrl}
                  disabled={!currentImageUrl}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  title="Salin Link Gambar"
                >
                  <i className="bx bx-link text-base"></i> Salin Link
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleUseAsInput}
                  disabled={!currentImageUrl}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  <i className="bx bx-paperclip text-base"></i> Pasang di Input
                </button>
                <button
                  onClick={handleSendToChat}
                  disabled={!currentImageUrl}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,190,152,0.4)] disabled:opacity-40 disabled:scale-100 flex items-center gap-1.5"
                >
                  <i className="bx bxs-send text-base"></i> Kirim ke Obrolan
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
