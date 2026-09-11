'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export default function CameraCaptureModal({ isOpen, onClose, onCapture, onOpenStudioWithPhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (depan) atau 'environment' (belakang)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Hentikan stream kamera
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Nyalakan stream kamera
  const startCamera = useCallback(async () => {
    setIsLoadingCamera(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat Anda tidak mendukung akses kamera langsung melalui browser.');
      }

      // Cek apakah ada lebih dari satu kamera
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        // Abaikan error enumerate devices
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      let msg = 'Gagal mengakses kamera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak. Berikan izin kamera di browser Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kamera tidak ditemukan pada perangkat Anda.';
      }
      setCameraError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingCamera(false);
    }
  }, [facingMode, stopStream]);

  // Efek saat modal terbuka / tertutup
  useEffect(() => {
    let timer;
    if (isOpen) {
      timer = setTimeout(() => {
        startCamera();
      }, 0);
    } else {
      stopStream();
    }
    return () => {
      if (timer) clearTimeout(timer);
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Ganti kamera depan / belakang
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Jepret foto dari video
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger efek flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Jika kamera depan, flip horizontal agar mirror sesuai preview
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedImage(dataUrl);
    stopStream();
  };

  // Ambil ulang foto
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Gunakan foto di Chat Athlos
  const handleUseInChat = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
      toast.success('Foto berhasil disematkan ke input chat!');
      handleClose();
    }
  };

  // Bawa foto ke Studio Generator AI
  const handleTransformWithAI = () => {
    if (capturedImage) {
      if (onOpenStudioWithPhoto) {
        onOpenStudioWithPhoto(capturedImage);
      }
      handleClose();
    }
  };

  const handleClose = () => {
    stopStream();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#1a1615] border border-[#FFBE98]/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.8)] relative flex flex-col">
        {/* Flash Effect Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
        )}

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#201B1A]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FFBE98] to-[#F9A48C] flex items-center justify-center text-[#201B1A]">
              <i className="bx bx-camera text-xl font-bold"></i>
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">Kamera Athlos AI</h3>
              <p className="text-[11px] text-gray-400">
                {capturedImage ? 'Tinjau & pilih tindakan' : 'Ambil foto langsung untuk dianalisa atau diolah'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Kamera"
          >
            <i className="bx bx-x text-2xl"></i>
          </button>
        </div>

        {/* Camera Viewport / Preview Area */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            // Captured Image Preview
            <img
              src={capturedImage}
              alt="Hasil Jepretan"
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            // Live Video Feed
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder HUD Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/15 m-4 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-[#FFBE98]/80 rounded-tl"></div>
                  <span className="text-[10px] font-mono tracking-widest bg-black/60 px-2 py-0.5 rounded text-[#FFBE98] border border-[#FFBE98]/30">
                    LIVE • {facingMode === 'user' ? 'FRONT' : 'BACK'}
                  </span>
                  <div className="w-4 h-4 border-t-2 border-r-2 border-[#FFBE98]/80 rounded-tr"></div>
                </div>
                {/* Center crosshair */}
                <div className="self-center w-6 h-6 border border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#FFBE98]/80 rounded-full"></div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-[#FFBE98]/80 rounded-bl"></div>
                  <div className="w-4 h-4 border-b-2 border-r-2 border-[#FFBE98]/80 rounded-br"></div>
                </div>
              </div>

              {/* Loading State */}
              {isLoadingCamera && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-white">
                  <i className="bx bx-loader-alt bx-spin text-3xl text-[#FFBE98]"></i>
                  <span className="text-xs text-gray-300">Menghubungkan ke kamera...</span>
                </div>
              )}

              {/* Error State */}
              {cameraError && (
                <div className="absolute inset-0 bg-[#161312]/95 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                    <i className="bx bx-video-off text-2xl"></i>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">Akses Kamera Gagal</p>
                  <p className="text-xs text-gray-400 mb-4 max-w-xs">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
                  >
                    <i className="bx bx-refresh text-base"></i> Coba Lagi
                  </button>
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas for capture processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Camera Controls & Actions Bar */}
        <div className="p-4 bg-[#1e1918] border-t border-white/10 flex flex-col gap-3">
          {capturedImage ? (
            // Actions after photo taken
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleRetake}
                className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10 flex items-center justify-center gap-1.5"
              >
                <i className="bx bx-refresh text-base"></i> Ambil Ulang
              </button>

              <button
                onClick={handleTransformWithAI}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5"
              >
                <i className="bx bx-palette text-base"></i> Buat AI Art
              </button>

              <button
                onClick={handleUseInChat}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] font-bold rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(255,190,152,0.3)] flex items-center justify-center gap-1.5"
              >
                <i className="bx bx-check text-base"></i> Pakai di Chat
              </button>
            </div>
          ) : (
            // Actions while camera is active
            <div className="flex items-center justify-between px-4">
              {/* Switch Front/Back Camera */}
              {hasMultipleCameras ? (
                <button
                  onClick={toggleCameraFacing}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
                  title="Ganti Kamera Depan/Belakang"
                >
                  <i className="bx bx-sync text-xl"></i>
                </button>
              ) : (
                <div className="w-11"></div> // placeholder balancer
              )}

              {/* Big Shutter Button */}
              <button
                onClick={takeSnapshot}
                disabled={isLoadingCamera || !!cameraError}
                className="w-16 h-16 rounded-full p-1 border-2 border-[#FFBE98] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100 shadow-[0_0_20px_rgba(255,190,152,0.4)]"
                title="Jepret Foto"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#FFBE98] to-[#F9A48C] flex items-center justify-center text-[#201B1A]">
                  <i className="bx bxs-camera text-2xl"></i>
                </div>
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleClose}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
                title="Batal"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
