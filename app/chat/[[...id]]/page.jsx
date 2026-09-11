'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import pptxgen from "pptxgenjs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
const BoxIcon = ({ name, size, color, className, style, onClick, ...rest }) => (
  <i
    className={`bx ${name} ${className || ''}`}
    style={{ fontSize: size ? `${size}px` : 'inherit', color: color || 'inherit', cursor: onClick ? 'pointer' : 'inherit', ...style }}
    onClick={onClick}
    {...rest}
  ></i>
);
const Send = (p) => <BoxIcon name="bxs-send" {...p} />;
const Plus = (p) => <BoxIcon name="bx-plus" {...p} />;
const Home = (p) => <BoxIcon name="bx-home" {...p} />;
const MessageSquare = (p) => <BoxIcon name="bx-message-square" {...p} />;
const Menu = (p) => <BoxIcon name="bx-menu" {...p} />;
const User = (p) => <BoxIcon name="bxs-user" {...p} />;
const Bot = (p) => <BoxIcon name="bx-bot" {...p} />;
const Loader2 = (p) => <BoxIcon name="bx-loader-alt bx-spin" {...p} />;
const Copy = (p) => <BoxIcon name="bx-copy" {...p} />;
const Check = (p) => <BoxIcon name="bx-check" {...p} />;
const ArrowDown = (p) => <BoxIcon name="bx-down-arrow-alt" {...p} />;
const Presentation = (p) => <BoxIcon name="bx-slideshow" {...p} />;
const Mic = (p) => <BoxIcon name="bx-microphone" {...p} />;
const MicOff = (p) => <BoxIcon name="bx-microphone-off" {...p} />;
const Volume2 = (p) => <BoxIcon name="bx-volume-full" {...p} />;
const Download = (p) => <BoxIcon name="bx-download" {...p} />;
const Sparkles = (p) => <BoxIcon name="bx-sparkles" {...p} />;
const Play = (p) => <BoxIcon name="bx-play" {...p} />;
const X = (p) => <BoxIcon name="bx-x" {...p} />;
const Lock = (p) => <BoxIcon name="bx-lock" {...p} />;
const LogOut = (p) => <BoxIcon name="bx-log-out" {...p} />;
const Crown = (p) => <BoxIcon name="bx-crown" {...p} />;
const LayoutDashboard = (p) => <BoxIcon name="bx-layout" {...p} />;
const ThumbsUp = (p) => <BoxIcon name="bx-like" {...p} />;
const ThumbsDown = (p) => <BoxIcon name="bx-dislike" {...p} />;
const Globe = (p) => <BoxIcon name="bx-globe" {...p} />;
const Eye = (p) => <BoxIcon name="bx-show" {...p} />;
const EyeOff = (p) => <BoxIcon name="bx-hide" {...p} />;
const Square = (p) => <BoxIcon name="bx-square" {...p} />;
const RefreshCw = (p) => <BoxIcon name="bx-refresh" {...p} />;
const ImageIcon = (p) => <BoxIcon name="bx-image" {...p} />;
const XCircle = (p) => <BoxIcon name="bx-x-circle" {...p} />;
const Trash2 = (p) => <BoxIcon name="bx-trash" {...p} />;
const Search = (p) => <BoxIcon name="bx-search" {...p} />;
const BroadcastIcon = (p) => <BoxIcon name="bx-broadcast" {...p} />;
const Maximize = (p) => <BoxIcon name="bx-expand" {...p} />;
const Code = (p) => <BoxIcon name="bx-code-alt" {...p} />;
const Camera = (p) => <BoxIcon name="bx-camera" {...p} />;
const Palette = (p) => <BoxIcon name="bx-palette" {...p} />;
const ShieldAlert = (p) => <BoxIcon name="bx-shield-x" {...p} />;

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import { Toaster, toast } from 'react-hot-toast';
import mermaid from 'mermaid';
import CameraCaptureModal from '../../components/CameraCaptureModal';
import RealtimeImageStudio from '../../components/RealtimeImageStudio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const SECRET_KEY = 'aquarius-super-secret-key';

const PROMPT_TEMPLATES = [
  { icon: '💻', category: 'Coding', text: 'Buatkan contoh kode React sederhana untuk fitur: \n\n' },
  { icon: '📝', category: 'Jurnal', text: 'Bantu saya menulis entri jurnal/refleksi hari ini tentang: \n\n' },
  { icon: '📚', category: 'Belajar', text: 'Tolong jelaskan konsep ini dengan bahasa yang sangat sederhana layaknya untuk anak umur 10 tahun.' },
  { icon: '💼', category: 'Profesional', text: 'Tolong perbaiki grammar dan tata bahasa dari teks berikut agar terlihat profesional: \n\n' },
  { icon: '✍️', category: 'Blogger', text: 'Bertindaklah sebagai penulis blog SEO profesional. Tolong buatkan sebuah artikel blog terstruktur, menarik, dan SEO-friendly dengan judul/topik: \n\n' },
  { icon: '⚙️', category: 'Workflow', text: 'Buatkan workflow JSON untuk alur otomatisasi berikut: \n\n' }
];

// Fitur 28: Smart Reply Suggestions
const SUGGESTIONS = [
  "Bisa jelaskan lebih detail?",
  "Berikan saya contoh kasus nyata.",
  "Bagaimana cara menerapkannya?",
  "Apa kelebihan dan kekurangannya?"
];

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Kode berhasil disalin!', { style: { background: '#333', color: '#fff' } });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span className="text-[10px] uppercase">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

// Feature 51: Feedback Button
const FeedbackButton = ({ icon: Icon, type }) => {
  const [clicked, setClicked] = useState(false);
  return (
    <button onClick={() => setClicked(true)} className={`transition-colors ${clicked ? (type === 'up' ? 'text-green-400' : 'text-red-400') : 'text-gray-400 hover:text-white'}`}>
      <Icon size={14} className={clicked ? 'fill-current' : ''} />
    </button>
  );
};

const encryptData = (data) => CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    try { return JSON.parse(ciphertext); } catch { return []; }
  }
};

// Feature 50: I18n Translations
const T = {
  id: {
    newChat: 'Obrolan Baru',
    recent: 'Terbaru',
    guestLimit: 'Batas Guest Tercapai',
    loginPrompt: 'Silakan login untuk melanjutkan obrolan tanpa batas!',
    loginBtn: 'Login Sekarang',
    regBtn: 'Daftar Akun',
    inputPlaceholder: 'Tulis Pesan Anda Disini...',
    disclaimer: 'Athlos AI bisa saja salah. Harap verifikasi informasi penting.',
    upgrade: 'Upgrade ke Pro'
  },
  en: {
    newChat: 'New Chat',
    recent: 'Recent',
    guestLimit: 'Guest Limit Reached',
    loginPrompt: 'Please login to continue chatting limitlessly!',
    loginBtn: 'Login Now',
    regBtn: 'Register Account',
    inputPlaceholder: 'Write Your Message Here...',
    disclaimer: 'Athlos AI can make mistakes. Consider verifying important info.',
    upgrade: 'Upgrade to Pro'
  }
};

// Feature 57: Mermaid Flowchart Renderer
const MermaidChart = React.memo(({ chart }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark', fontFamily: 'Inter, sans-serif' });
    let isMounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvg(svg);
          setError(false);
        }
      } catch (err) {
        console.error("Mermaid parsing error:", err);
        if (isMounted) setError(true);
      }
    };
    if (chart) renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm overflow-x-auto my-4 shadow-md">
        <p className="font-bold mb-2 flex items-center gap-2"><XCircle size={16} /> Error rendering flowchart</p>
        <pre className="text-xs font-mono">{chart}</pre>
      </div>
    );
  }

  const handleDownload = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athlos-flowchart-${new Date().getTime()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Gambar flowchart berhasil diunduh!', { style: { background: '#333', color: '#fff' } });
  };

  return (
    <div className="relative my-6 p-6 bg-[#1a1a1a] rounded-xl border border-white/10 flex justify-center overflow-x-auto shadow-inner ring-1 ring-white/5 group/chart">
      {svg && (
        <button 
          onClick={handleDownload} 
          className="absolute top-3 right-3 p-1.5 px-3 bg-[#2f2f2f]/80 hover:bg-[#3f3f3f] backdrop-blur-md text-white rounded-lg opacity-0 group-hover/chart:opacity-100 transition-all flex items-center gap-2 text-xs font-bold border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-105"
          title="Download SVG"
        >
          <Download size={14} /> Download
        </button>
      )}
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="text-[#FFBE98] text-sm animate-pulse flex items-center gap-2"><Loader2 size={16} /> Menggambar Flowchart...</div>}
    </div>
  );
});
MermaidChart.displayName = 'MermaidChart';

const sanitizeMarkdownText = (rawText) => {
  if (!rawText) return '';

  // 1. Tangani format ![alt](https://image.pollinations.ai/prompt/teks spasi?params)
  let processed = rawText.replace(/!\[(.*?)\]\((https?:\/\/image\.pollinations\.ai\/prompt\/)([\s\S]*?)\)/g, (match, alt, base, rest) => {
    let promptPart = rest;
    let queryPart = '';
    const qIndex = rest.indexOf('?');
    if (qIndex !== -1) {
      promptPart = rest.slice(0, qIndex);
      queryPart = rest.slice(qIndex);
    } else {
      queryPart = '?width=1024&height=1024&nologo=true';
    }
    // Encode karakter spesial dan spasi
    const cleanPrompt = encodeURIComponent(decodeURIComponent(promptPart.trim()).replace(/\s+/g, ' '));
    return `![${alt || 'Generated Image'}](${base}${cleanPrompt}${queryPart})`;
  });

  return processed;
};

const MemoizedMarkdown = React.memo(function MemoizedMarkdown({ text, openCanvas, onEditImage }) {
  const sanitizedText = React.useMemo(() => sanitizeMarkdownText(text), [text]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}
      components={{
        img({ src, alt }) {
          let extractedPrompt = alt || 'Gambar AI';
          if ((extractedPrompt === 'Generated Image' || !extractedPrompt) && src && src.includes('/prompt/')) {
            try {
              const match = src.match(/\/prompt\/([^?]+)/);
              if (match && match[1]) {
                extractedPrompt = decodeURIComponent(match[1]);
              }
            } catch {
              extractedPrompt = 'Gambar AI';
            }
          }

          return (
            <div className="my-4 rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl group/img relative inline-block max-w-full">
              <img
                src={src}
                alt={extractedPrompt}
                className="max-w-full max-h-[520px] object-contain rounded-2xl bg-[#161312] transition-transform duration-300 block"
                loading="lazy"
              />
              
              {/* Floating Action Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/85 backdrop-blur-md p-1.5 rounded-xl border border-white/15 shadow-xl">
                {onEditImage && (
                  <button
                    onClick={() => onEditImage(extractedPrompt, src)}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] font-bold text-xs rounded-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(255,190,152,0.4)] cursor-pointer"
                    title="Edit dan Sesuaikan Gambar di Studio Real-time"
                  >
                    <Palette size={14} /> <span>Edit di Studio</span>
                  </button>
                )}
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs flex items-center justify-center cursor-pointer"
                  title="Buka Gambar Resolusi Penuh"
                >
                  <Download size={14} />
                </a>
              </div>
            </div>
          );
        },
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          return !inline && match ? (
            match[1].toLowerCase() === 'mermaid' ? (
              <MermaidChart chart={codeString} />
            ) : (
            <div className="my-4 rounded-lg overflow-hidden border border-[#333] shadow-md group/code">
              <div className="flex items-center justify-between px-4 py-2 bg-[#2f2f2f] text-xs font-sans text-gray-400 border-b border-[#333]">
                <span className="font-medium">{match[1]}</span>
                <div className="flex items-center gap-3">
                  {match[1] === 'html' && (
                    <button onClick={() => {
                      let htmlContent = codeString;
                      if (!htmlContent.includes('tailwindcss')) {
                        htmlContent = `<script src="https://cdn.tailwindcss.com"></script>\n${htmlContent}`;
                      }
                      openCanvas({ type: 'html', content: htmlContent });
                    }} className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1 border border-gray-600 px-2 py-0.5 rounded-md hover:border-green-400/50">
                      <Play size={12} /> <span className="text-[10px] uppercase font-bold">Preview</span>
                    </button>
                  )}
                  <button onClick={() => openCanvas({ type: 'code', content: codeString, language: match[1] })} className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1 border border-gray-600 px-2 py-0.5 rounded-md hover:border-blue-400/50 opacity-0 group-hover/code:opacity-100">
                    <Maximize size={12} /> <span className="text-[10px] uppercase font-bold">Canvas</span>
                  </button>
                  <CopyButton text={codeString} />
                </div>
              </div>
              <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="!m-0 !bg-[#1e1e1e]" {...props}>{codeString}</SyntaxHighlighter>
            </div>
            )
          ) : (<code className="bg-[#2f2f2f] px-1.5 py-0.5 rounded text-gray-200 font-mono text-sm before:content-[''] after:content-['']" {...props}>{children}</code>)
        }
      }}>{sanitizedText}</ReactMarkdown>
  );
});

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdFromUrl = params?.id?.[0] || null;

  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [canvasState, setCanvasState] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);;

  const [lang, setLang] = useState('id'); // Feature 50
  const t = T[lang];

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isStream, setIsStream] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [bannedUsers, setBannedUsers] = useState([]);

  // Fitur 1: Search Chat History
  const [searchQuery, setSearchQuery] = useState('');

  // Feature 8: Math Captcha
  const [captchaSum, setCaptchaSum] = useState({ a: 0, b: 0 });
  const [userCaptcha, setUserCaptcha] = useState('');
  const [isServerDown, setIsServerDown] = useState(false); // Feature 30

  const isUserBanned = user && bannedUsers.includes(user.id);

  const generateCaptcha = () => setCaptchaSum({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });

  useEffect(() => {
    if (authMode === 'register') generateCaptcha();
  }, [authMode]);

  useEffect(() => {
    const prompt = searchParams?.get('prompt');
    if (prompt && input === '') {
      setInput(prompt);
      router.replace('/chat');
    }
  }, [searchParams]);

  // Using state instead of initial function to avoid hydration mismatch
  const [guestChatCount, setGuestChatCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);

  const [sidebarChats, setSidebarChats] = useState([]);
  const [persona, setPersona] = useState('normal');
  const [aiEngine, setAiEngine] = useState('openrouter');
  const [factCheck, setFactCheck] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [selectionPos, setSelectionPos] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fitur Kamera Langsung & Studio Gambar Real-time
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [studioReferencePhoto, setStudioReferencePhoto] = useState(null);
  const [studioInitialPrompt, setStudioInitialPrompt] = useState('');

  const handleCapturePhoto = (dataUrl) => {
    setSelectedImage(dataUrl);
  };

  const handleOpenStudioFromCamera = (dataUrl) => {
    setStudioReferencePhoto(dataUrl);
    setStudioInitialPrompt('Cyberpunk portrait based on photo, vibrant neon reflections');
    setShowImageStudio(true);
  };

  const handleOpenStudioForEdit = (promptText, imageUrl) => {
    setStudioInitialPrompt(promptText || '');
    setStudioReferencePhoto(imageUrl || null);
    setShowImageStudio(true);
  };

  const handleSendStudioImageToChat = (imageUrl, promptText) => {
    const userMsg = {
      role: 'user',
      text: `Buatkan gambar: "${promptText}"`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const assistantMsg = {
      role: 'assistant',
      text: `Berikut adalah visualisasi gambar real-time yang berhasil digenerate:\n\n![${promptText}](${imageUrl})\n\n> **Prompt:** *${promptText}*\n> **Status:** Gambar siap diunduh atau digunakan.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChat(prev => [...prev, userMsg, assistantMsg]);
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleUseStudioImageAsInput = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current && loading) {
      abortControllerRef.current.abort();
      setLoading(false);
      toast.error('Jawaban dihentikan', { style: { background: '#333', color: '#fff' } });
    }
  };

  useEffect(() => {
    setGuestChatCount(parseInt(localStorage.getItem('guest_chat_count') || '0'));
    
    // Fitur 56: Fetch Global Broadcast (Real-time Polling)
    const fetchBroadcast = async () => {
      try {
        const res = await fetch('/api/admin/config');
        const data = await res.json();
        setBroadcastMessage(prev => prev !== data?.broadcast ? (data?.broadcast || '') : prev);
        setBannedUsers(data?.banned_users || []);
      } catch (e) {}
    };
    fetchBroadcast();
    const broadcastInterval = setInterval(fetchBroadcast, 15000); // 15 detik polling
    
    // Load Remember Me credentials
    const savedEmail = localStorage.getItem('athlos_saved_email');
    const savedPassword = localStorage.getItem('athlos_saved_password');
    if (savedEmail && savedPassword) {
      setAuthEmail(savedEmail);
      try {
        setAuthPassword(decryptData(savedPassword));
        setRememberMe(true);
      } catch (e) {
        // Ignore decrypt error
      }
    }

    return () => clearInterval(broadcastInterval);
  }, []);

  const fetchSidebarChats = async (userId) => {
    const { data, error } = await supabase.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error && data) setSidebarChats(data);
  };

  const confirmDeleteChat = async () => {
    const chatId = deleteConfirmId;
    setDeleteConfirmId(null);
    if (!chatId) return;
    
    if (user) {
      const { error } = await supabase.from('chats').delete().eq('id', chatId);
      if (error) {
        toast.error("Gagal menghapus obrolan.");
        return;
      }
    }
    
    setSidebarChats(prev => prev.filter(c => c.id !== chatId));
    
    if (activeChatId === chatId) {
      clearChat();
    }
    
    toast.success("Obrolan berhasil dihapus.", { style: { background: '#333', color: '#fff' } });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchSidebarChats(session.user.id);
      } else {
        localStorage.removeItem('athlos_guest_chats');
        setSidebarChats([]);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchSidebarChats(session.user.id);
      } else {
        localStorage.removeItem('athlos_guest_chats');
        setSidebarChats([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Sinkronisasi rute URL dengan obrolan yang aktif
    if (chatIdFromUrl && chatIdFromUrl !== activeChatId) {
      // Pastikan kita sudah selesai mengecek auth state (user) dan sidebar load jika guest
      if (user !== undefined) {
        loadChat(chatIdFromUrl);
      }
    } else if (!chatIdFromUrl && activeChatId) {
      // Hindari race-condition dengan delay Next.js useParams setelah history.pushState
      if (window.location.pathname === '/chat') {
        clearChat();
      }
    }
  }, [chatIdFromUrl, user, sidebarChats, activeChatId]);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (authMode === 'register') {
      if (parseInt(userCaptcha) !== captchaSum.a + captchaSum.b) {
        setAuthError('Captcha matematika salah. Anda Robot?');
        generateCaptcha();
        return;
      }
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;

        // Cek jika butuh email confirmation
        if (data?.user && data?.user?.identities?.length === 0) {
          toast.error("Email sudah terdaftar atau butuh konfirmasi.", { style: { background: '#333', color: '#fff' } });
        } else {
          toast.success("Pendaftaran berhasil! Silakan login.", { style: { background: '#333', color: '#fff' } });
        }
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        
        if (rememberMe) {
          localStorage.setItem('athlos_saved_email', authEmail);
          localStorage.setItem('athlos_saved_password', encryptData(authPassword));
        } else {
          localStorage.removeItem('athlos_saved_email');
          localStorage.removeItem('athlos_saved_password');
        }
        
        // Membuka obrolan baru yang kosong khusus untuk user yang baru login
        setChat([]);
        setActiveChatId(null);
        setShowAuthModal(false);
      }
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        setAuthError('Gagal terhubung ke database. Pastikan URL Supabase valid dan server aktif.');
      } else {
        setAuthError(error.message || "Gagal menghubungi server autentikasi.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: { redirectTo: window.location.origin + '/chat' }
      });
      if (error) throw error;
      
      setChat([]);
      setActiveChatId(null);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => await supabase.auth.signOut();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = lang === 'id' ? 'id-ID' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
      };

      recognitionRef.current.onerror = (e) => { setIsListening(false); };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [lang]);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { recognitionRef.current?.start(); setIsListening(true); }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); inputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); clearChat(); }
      if (e.key === 'Escape') { setPreviewHtml(null); setShowTemplates(false); setSelectionPos(null); setShowAdmin(false); setShowAuthModal(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMouseUp = (e) => {
      if (e.target.closest('.explain-popup')) return;
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && chatContainerRef.current && chatContainerRef.current.contains(e.target)) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top - 40, text });
      } else {
        setSelectionPos(null);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleExplain = () => {
    if (!selectionPos) return;
    setInput(`Tolong jelaskan secara mendetail maksud dari teks berikut:\n\n"${selectionPos.text}"`);
    setSelectionPos(null);
    window.getSelection().removeAllRanges();
    inputRef.current?.focus();
  };

  useEffect(() => {
    // Obrolan Guest tidak lagi disimpan ke local storage agar tidak tertampung
  }, [chat, activeChatId, user]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleRegenerate = () => {
    if (chat.length < 2 || loading) return;
    const newChat = [...chat];
    newChat.pop(); // Hapus pesan AI terakhir
    const lastUserMsg = newChat.pop(); // Ambil & Hapus pesan User terakhir
    setChat(newChat);
    sendChat(lastUserMsg.text);
  };

  useEffect(() => {
    // Auto-scroll saat ada pesan baru jika tidak sedang scroll ke atas
    if (!showScrollButton) scrollToBottom();
  }, [chat, showScrollButton]);

  const loadChat = async (chatId) => {
    if (loading) return;
    if (user) {
      const { data, error } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
      if (!error && data) {
        const formattedChat = data.map(msg => ({ role: msg.role === 'user' ? 'user' : 'assistant', text: msg.content }));
        setChat(formattedChat);
        setActiveChatId(chatId);
        setShowScrollButton(false);
        setTimeout(() => {
          if (chatContainerRef.current) chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'auto' });
        }, 50);
        if (window.innerWidth < 768) setSidebarOpen(false);
      }
    } else {
      const chatData = sidebarChats.find(c => c.id === chatId);
      if (chatData) {
        setChat(chatData.messages || []);
        setActiveChatId(chatId);
        setShowScrollButton(false);
        setTimeout(() => {
          if (chatContainerRef.current) chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'auto' });
        }, 50);
        if (window.innerWidth < 768) setSidebarOpen(false);
      }
    }
  };

  const handleExportPPT = (text) => {
    try {
      const pptx = new pptxgen();
      
      const lines = text.split('\n');
      let currentSlide = pptx.addSlide();
      currentSlide.addText("Athlos AI Presentation", { x: 1, y: 0.5, fontSize: 24, bold: true, color: '363636' });
      
      let currentY = 1.5;
      
      for (const line of lines) {
        if (currentY > 4.5) {
          currentSlide = pptx.addSlide();
          currentY = 0.5;
        }
        
        if (line.startsWith('#')) {
          currentSlide = pptx.addSlide();
          const level = line.match(/^#+/)[0].length;
          const cleanText = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
          currentSlide.addText(cleanText, { x: 1, y: 0.5, fontSize: 28 - (level * 2), bold: true, color: '111111' });
          currentY = 1.5;
        } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const cleanText = line.trim().replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
          currentSlide.addText([{ text: cleanText, options: { bullet: true } }], { x: 1.5, y: currentY, fontSize: 16, color: '333333' });
          currentY += 0.4;
        } else if (line.trim().length > 0) {
          const cleanText = line.replace(/\*\*/g, '');
          currentSlide.addText(cleanText, { x: 1, y: currentY, fontSize: 14, color: '666666' });
          currentY += 0.5;
        }
      }
      
      pptx.writeFile({ fileName: `Athlos_AI_${new Date().getTime()}.pptx` });
      toast.success('Mengekspor PPTX...');
    } catch (e) {
      console.error(e);
      toast.error('Gagal membuat PPTX');
    }
  };

  const clearChat = () => {
    stopGenerating();
    setChat([]);
    setActiveChatId(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
    router.push('/chat');
  };

  // Feature 46: Auto-Retry Mechanism integrated inside sendChat
  const sendChat = async (overrideInput = null) => {
    const chatInput = overrideInput || input;
    const currentImage = selectedImage;
    if ((!chatInput.trim() && !currentImage) || loading) return;

    if (!user && guestChatCount >= 999999) {
      setShowAuthModal(true); return;
    }
    if (!user) {
      const newCount = guestChatCount + 1;
      setGuestChatCount(newCount);
      localStorage.setItem('guest_chat_count', newCount.toString());
    }

    window.speechSynthesis?.cancel();

    const userMsg = { role: 'user', text: chatInput, image: currentImage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const aiPlaceholder = { role: 'assistant', text: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    setChat(prev => [...prev, userMsg, aiPlaceholder]);

    const historyPayload = chat.map(c => ({ role: c.role, text: c.text }));

    if (!overrideInput) {
      setInput('');
      setSelectedImage(null);
    }
    setLoading(true);
    setTimeout(() => scrollToBottom(), 100);

    let currentChatId = activeChatId;
    let resolveChatId;
    let chatIdPromise = new Promise(res => { resolveChatId = res; });

    // Fitur Canggih: Background Database Sync (Fire-and-Forget)
    // Jangan biarkan database memperlambat AI. Jalankan di background!
    if (user) {
      (async () => {
        try {
          let dbChatId = currentChatId;
          if (!dbChatId) {
            const title = chatInput.length > 30 ? chatInput.slice(0, 30) + '...' : chatInput;
            const { data, error } = await supabase.from('chats').insert({ user_id: user.id, title }).select().single();
            if (data && !error) {
              dbChatId = data.id;
              setActiveChatId(dbChatId);
              setSidebarChats(prev => [data, ...prev]);
              window.history.pushState(null, '', '/chat/' + dbChatId);
            }
          }
          resolveChatId(dbChatId);
          if (dbChatId) {
            await supabase.from('messages').insert({ chat_id: dbChatId, role: 'user', content: chatInput });
          }
        } catch (e) {
          console.warn("Background DB Sync failed:", e);
          resolveChatId(null);
        }
      })();
    } else {
      (async () => {
        try {
          let guestChatId = currentChatId;
          if (!guestChatId) {
            guestChatId = Date.now().toString();
            setActiveChatId(guestChatId);
            const title = chatInput.length > 30 ? chatInput.slice(0, 30) + '...' : chatInput;
            const newChatData = { id: guestChatId, title, created_at: new Date().toISOString(), messages: [] };
            // Fitur: Obrolan Guest tidak ditampung di sidebar history
            setSidebarChats([]);
            localStorage.removeItem('athlos_guest_chats');
            window.history.pushState(null, '', '/chat/' + guestChatId);
          }
          resolveChatId(guestChatId);
        } catch (e) {
          console.warn("Guest Sync failed:", e);
          resolveChatId(null);
        }
      })();
    }

    let retryCount = 0;
    const MAX_RETRIES = 2;

    abortControllerRef.current = new AbortController();

    const attemptFetch = async () => {
      try {
        let finalPayload = chatInput;
        const lowerInput = chatInput.toLowerCase();

        // Fitur 29: Analisis Sentimen Sederhana
        if (lowerInput.match(/(marah|kesal|benci|kecewa)/)) {
          finalPayload += "\n\n[System Note: Pengguna sepertinya sedang kesal/marah. Tolong jawab dengan ekstra sabar, lembut, ramah dan menenangkan.]";
        } else if (lowerInput.match(/(sedih|nangis|kecewa|gagal|hancur|depresi|menyerah)/)) {
          finalPayload += "\n\n[System Note: Pengguna sepertinya sedang sedih. Tolong jawab dengan penuh empati, memotivasi, sangat hangat dan menghibur.]";
        }

        const payloadBody = { message: finalPayload, history: historyPayload, persona, aiEngine, isStream, factCheck, autoPilot };
        if (autoPilot) payloadBody.isStream = false; // Disable streaming for pure JSON
        if (currentImage) payloadBody.image = currentImage;

        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payloadBody),
          signal: abortControllerRef.current.signal
        });

        if (response.status === 503) {
          setIsServerDown(true);
          throw new Error("Server Sedang Maintenance (Fitur AI dimatikan dari Backend).");
        }

        if (response.status === 429) throw new Error("Rate Limit Terlampaui. Coba lagi dalam 1 jam.");
        if (response.status === 403) throw new Error("Akses Ditolak: Fitur WAF/Honeypot memblokir IP Anda karena aktivitas mencurigakan.");
        if (!response.ok) {
          if (response.status === 401) {
            await supabase.auth.signOut();
            setUser(null);
            throw new Error("Sesi login Anda telah berakhir atau tidak valid. Silakan logout dan login kembali.");
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal menghubungi server (HTTP ${response.status}).`);
        }

        if (!isStream) {
          const data = await response.json();
          setChat(prev => {
            if (prev.length === 0) return prev;
            const newChat = [...prev];
            newChat[newChat.length - 1].text = data.text;
            return newChat;
          });
          if (chatContainerRef.current) {
             const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
             const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
             if (isNearBottom) {
               setTimeout(() => {
                 if (chatContainerRef.current) chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
               }, 10);
             }
          }
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let aiText = '';
        window.hasRedirectedThisTurn = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunkString = decoder.decode(value, { stream: true });
            const lines = chunkString.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.replace('data: ', ''));
                  aiText += data.text;
                  setChat(prev => {
                    if (prev.length === 0) return prev;
                    const newChat = [...prev];
                    newChat[newChat.length - 1].text = aiText;
                    return newChat;
                  });

                  // Fitur Baru: AI Browser Control (Auto-Redirect)
                  if (aiText.includes('[REDIRECT:')) {
                    const redirectMatch = aiText.match(/\[REDIRECT:\s*(https?:\/\/[^\]]+)\]/);
                    if (redirectMatch && redirectMatch[1] && !window.hasRedirectedThisTurn) {
                      window.hasRedirectedThisTurn = true;
                      window.open(redirectMatch[1], '_blank');
                    }
                  }
                  if (chatContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
                    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
                    if (isNearBottom) {
                      setTimeout(() => {
                        if (chatContainerRef.current) chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight });
                      }, 10);
                    }
                  }
                } catch (e) { /* ignore parse error */ }
              }
            }
          }
        }
        
        // Simpan balasan AI ke Supabase secara background
        const finalChatId = await chatIdPromise;
        if (user && finalChatId && aiText) {
          supabase.from('messages').insert({ chat_id: finalChatId, role: 'assistant', content: aiText }).then();
        }

      } catch (err) {
        if (err.name === 'AbortError' || err.message.includes('aborted')) {
          console.log('Fetch aborted by user.');
          return;
        }
        
        if (retryCount < MAX_RETRIES && err.message !== "Rate Limit Terlampaui. Coba lagi dalam 1 jam.") {
          retryCount++;
          console.warn(`Fetch failed. Retrying... (${retryCount}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await attemptFetch(); // recursive retry
        } else {
          setChat(prev => {
            if (prev.length === 0) {
              return [{ role: 'assistant', text: `❌ **Error:** ${err.message}` }];
            }
            const newChat = [...prev];
            newChat[newChat.length - 1].text = `❌ **Error:** ${err.message}`;
            return newChat;
          });
        }
      }
    };

    await attemptFetch();
    setLoading(false);
  };

  const handleReadAloud = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[#*`~>_-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'id' ? 'id-ID' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Fitur 65: Render Auto-Pilot JSON
  const renderAutoPilotPlan = (text) => {
    try {
      const plan = JSON.parse(text);
      if (plan.goal && plan.tasks && Array.isArray(plan.tasks)) {
        return (
          <div className="bg-[#222] border border-[#444] rounded-xl p-5 my-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4 flex items-center gap-2">
              <Code size={20} className="text-blue-400" /> Auto-Pilot Plan: {plan.goal}
            </h3>
            <div className="space-y-3">
              {plan.tasks.map((task, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-[#161616] p-3 rounded-lg border border-[#333] hover:border-blue-500/50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 shadow-inner">
                    {task.id}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{task.agent_role}</div>
                    <div className="text-sm text-gray-200">{task.task}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] rounded uppercase font-bold tracking-wider">{task.status || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-lg transition-colors border border-blue-500/30 flex justify-center items-center gap-2 text-sm shadow-md hover:shadow-blue-500/20">
              <Play size={16} /> Eksekusi Rencana (BETA)
            </button>
          </div>
        );
      }
    } catch (e) {
      // Fail silently, fallback to standard markdown
    }
    return null;
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex bg-[#161312] text-gray-100 font-sans overflow-hidden selection:bg-[#FFBE98]/30">
      {/* Fitur 56: Global Broadcast Banner */}
      {broadcastMessage && (
        <div className="absolute top-0 left-0 w-full z-50 bg-yellow-500 text-black text-center py-2 px-4 text-sm font-bold shadow-lg flex items-center justify-center gap-2">
          <BroadcastIcon size={18} /> {broadcastMessage}
          <button onClick={() => setBroadcastMessage('')} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"><X size={20} /></button>
        </div>
      )}

      {/* Aurora Background (Subtle) */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#F9A48C]/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none animate-pulse duration-[10000ms]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFBE98]/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>

      <Toaster position="top-center" toastOptions={{ className: 'text-sm font-medium border border-white/10 bg-black/50 backdrop-blur-md text-white' }} />

      {/* HTML Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-md">
          <div className="bg-[#1e1e1e] w-full h-full max-w-6xl rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#333] relative animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#252525]">
              <div className="flex items-center gap-3 text-white font-semibold">
                <Play className="text-green-400" size={18} /> UI/UX Preview (Code Result)
              </div>
              <button onClick={() => setPreviewHtml(null)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-2">
                <X size={20} /> <span className="text-sm font-bold">Tutup Preview</span>
              </button>
            </div>
            <div className="flex-1 bg-white relative w-full h-full">
              <iframe 
                srcDoc={previewHtml} 
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                title="HTML Preview"
              />
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#2f2f2f] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#444] relative animate-in fade-in zoom-in-95">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black mx-auto mb-3"><Lock size={24} /></div>
              <h3 className="text-xl font-bold">{t.guestLimit}</h3>
              <p className="text-sm text-gray-400 mt-1">{t.loginPrompt}</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {authError && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded-lg">{authError}</div>}
              <div>
                <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required className="w-full bg-[#212121] border border-[#444] rounded-lg p-2.5 outline-none focus:border-white text-sm" placeholder="anda@email.com" />
              </div>
              <div className="relative">
                <input type={showAuthPassword ? "text" : "password"} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required minLength={6} className="w-full bg-[#212121] border border-[#444] rounded-lg p-2.5 outline-none focus:border-white text-sm pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                  {showAuthPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {authMode === 'login' && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded bg-[#212121] border-[#444] accent-white cursor-pointer" />
                  <label htmlFor="rememberMe" className="text-sm text-gray-400 select-none cursor-pointer">Ingat Saya</label>
                </div>
              )}

              {authMode === 'register' && (
                <div className="flex items-center gap-3 bg-[#212121] p-2.5 rounded-lg border border-[#444]">
                  <div className="text-sm font-bold text-gray-300 w-24 text-center">{captchaSum.a} + {captchaSum.b} =</div>
                  <input type="number" value={userCaptcha} onChange={(e) => setUserCaptcha(e.target.value)} required placeholder="Hasil" className="w-full bg-transparent outline-none text-sm font-medium" />
                </div>
              )}

              <button type="submit" disabled={authLoading} className="w-full bg-white text-black font-semibold rounded-lg p-2.5 text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                {authLoading ? <Loader2 size={16} className="animate-spin" /> : (authMode === 'login' ? t.loginBtn : t.regBtn)}
              </button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-400">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-white hover:underline font-medium">
                {authMode === 'login' ? 'Daftar Akun Baru' : 'Sudah Punya Akun? Login'}
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-[#444] pt-5">
              <button onClick={() => handleOAuthLogin('google')} className="w-full bg-white text-black font-semibold rounded-lg p-2.5 text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Lanjutkan dengan Google
              </button>
              <button onClick={() => handleOAuthLogin('github')} className="w-full bg-[#1e1e1e] border border-[#444] text-white font-semibold rounded-lg p-2.5 text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                Lanjutkan dengan GitHub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#2f2f2f] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#444] relative animate-in fade-in zoom-in-95 text-center">
            <button onClick={() => setDeleteConfirmId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black mx-auto mb-3 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Hapus Obrolan?</h3>
            <p className="text-sm text-gray-400 mb-6">Tindakan ini tidak dapat dibatalkan. Riwayat obrolan ini akan dihapus secara permanen dari server.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 bg-[#212121] border border-[#444] hover:bg-[#333] text-white rounded-xl font-semibold transition-colors text-sm">Batal</button>
              <button onClick={confirmDeleteChat} className="flex-1 py-2.5 bg-white hover:bg-gray-200 text-black rounded-xl font-semibold transition-colors shadow-lg text-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kamera Langsung */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCapturePhoto}
        onOpenStudioWithPhoto={handleOpenStudioFromCamera}
      />

      {/* Studio Gambar Real-time */}
      <RealtimeImageStudio
        key={showImageStudio ? `studio-${studioInitialPrompt}-${studioReferencePhoto ? '1' : '0'}` : 'closed'}
        isOpen={showImageStudio}
        onClose={() => setShowImageStudio(false)}
        initialPrompt={studioInitialPrompt}
        initialReferencePhoto={studioReferencePhoto}
        onSendToChat={handleSendStudioImageToChat}
        onUseAsInput={handleUseStudioImageAsInput}
      />

      {showAdmin && (
        <div className="fixed inset-0 bg-[#212121] z-[60] p-6 md:p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-3"><LayoutDashboard className="text-blue-400" /> Admin Dashboard</h1>
              <button onClick={() => setShowAdmin(false)} className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-lg flex items-center gap-2 font-medium">Tutup Panel</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#2f2f2f] p-6 rounded-xl border border-[#444] shadow-lg">
                <div className="text-gray-400 text-sm mb-2 font-medium">Total Pengguna Terdaftar</div>
                <div className="text-4xl font-bold">142</div>
                <div className="text-green-400 text-xs mt-2">↑ 12 minggu ini</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-ml-64'} fixed md:relative z-40 w-64 h-full bg-[#161312]/80 backdrop-blur-2xl transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] md:shadow-none border-r border-white/5`}>
        <div className="p-4 flex items-center justify-end border-b border-white/5 shrink-0">
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors" title="Tutup Sidebar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="mb-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cari obrolan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE98]/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>
          <button onClick={clearChat} className="w-full flex items-center justify-center gap-2 mb-4 p-3 rounded-xl bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(255,190,152,0.3)]">
            <Plus size={20} /> Obrolan Baru
          </button>
          <div className="text-[10px] font-bold text-gray-500 mb-3 px-2 uppercase tracking-widest">{t.recent}</div>
          {sidebarChats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
            <div key={c.id} className="relative group w-full">
              <button onClick={() => router.push('/chat/' + c.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm text-left truncate transition-all duration-300 border pr-10 ${activeChatId === c.id ? 'bg-gradient-to-r from-[#FFBE98]/20 to-transparent border-[#FFBE98]/30 text-white shadow-[inset_2px_0_0_#FFBE98]' : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <MessageSquare size={16} className={`shrink-0 ${activeChatId === c.id ? 'text-[#FFBE98]' : ''}`} />
                <span className="truncate font-medium">{c.title}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(c.id); }} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Hapus obrolan"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sidebarChats.length === 0 && (
            <div className="text-xs text-gray-500 px-2 italic">Belum ada riwayat obrolan.</div>
          )}
          {sidebarChats.length > 0 && sidebarChats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="text-xs text-gray-500 px-2 italic text-center py-4">Obrolan tidak ditemukan.</div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 mt-auto flex flex-col gap-1.5">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-2 py-2 mb-2 border-b border-white/5">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{user.email.split('@')[0]}</div>
                  <div className="text-[10px] text-yellow-400 font-medium tracking-wide">PRO MEMBER</div>
                </div>
              </div>
              
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <Home size={16} /> Beranda
              </Link>
              {user.email.includes('admin') && (
                <button onClick={() => setShowAdmin(true)} className="flex items-center gap-3 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-left">
                  <LayoutDashboard size={16} /> Admin Panel
                </button>
              )}

              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                <LogOut size={16} /> Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2">
                <Home size={16} /> Beranda
              </Link>
              <button onClick={() => setShowAuthModal(true)} className="w-full py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm">
                <User size={16} /> Login / Daftar
              </button>

            </>
          )}
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />}

      {selectionPos && (
        <button
          className="explain-popup fixed z-50 px-3 py-1.5 bg-[#444] hover:bg-[#555] text-white text-xs font-medium rounded-md shadow-xl border border-white/10 flex items-center gap-1.5 transition-transform"
          style={{ left: selectionPos.x, top: selectionPos.y, transform: 'translateX(-50%)' }}
          onClick={handleExplain}
        >
          <Sparkles size={14} className="text-yellow-400" /> Explain
        </button>
      )}



      {isServerDown ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#212121] z-20 absolute inset-0 md:static">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/50">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Graceful Degradation Aktif</h2>
          <p className="text-gray-400 text-center max-w-md">Koneksi ke otak AI dimatikan dari Backend (Feature Flags `aiEnabled: false`). Sistem tetap menyala secara gracefully, tidak crash. Silakan hubungi admin.</p>
          <button onClick={() => setIsServerDown(false)} className="mt-8 px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">Tutup Peringatan</button>
        </div>
      ) : (
        <>
        <div className={`h-[100dvh] w-full flex flex-col min-w-0 relative transition-all duration-300 ease-in-out overflow-x-hidden ${canvasState ? 'hidden md:flex md:flex-1 border-r border-[#333]' : 'flex-1'}`}>
          
          {/* Mobile Top Header (Mencegah chat menabrak tombol sidebar) */}
          <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#161312]/90 backdrop-blur-lg z-40 border-b border-white/5 flex items-center justify-center">
            <span className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE98] to-[#F9A48C]">Athlos AI</span>
          </div>

          {/* Floating Sidebar Toggle */}
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="fixed top-2 md:top-4 left-3 md:left-4 z-[100] p-2 md:p-2.5 bg-[#2f2f2f]/80 hover:bg-[#3f3f3f] backdrop-blur-md rounded-xl text-gray-300 hover:text-white transition-all shadow-lg border border-white/10 group flex items-center justify-center pointer-events-auto cursor-pointer"
              title="Buka Sidebar"
            >
              <Menu size={20} className="group-hover:scale-110 transition-transform pointer-events-none" />
            </button>
          )}

          <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative scroll-smooth">
            {chat.length === 0 ? (
              <div className="flex flex-col items-center px-4 pt-24 md:pt-24 pb-32 animate-in fade-in duration-700">
                <div className="relative mb-8 mt-4">
                  <div className="absolute inset-0 bg-[#FFBE98] blur-[60px] opacity-20 rounded-full animate-pulse"></div>
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#FFBE98]/20 to-[#F9A48C]/10 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,190,152,0.15)] relative border border-[#FFBE98]/30 backdrop-blur-md transform transition hover:scale-105 hover:rotate-6">
                    <img src="/Athlos AI.png" alt="Athlos AI Logo" className="w-full h-full object-cover rounded-3xl drop-shadow-[0_0_10px_rgba(255,190,152,0.8)]" />
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 text-center mb-2 pb-2 leading-normal tracking-tight">
                  Halo, Saya <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE98] to-[#F9A48C]">Athlos AI</span>
                </h2>
                <p className="text-gray-400 text-center max-w-lg mb-12 text-lg">
                  Asisten pintar Anda. Siap membantu menulis kode, merangkum dokumen, atau sekadar berdiskusi.
                </p>
              </div>
            ) : (
              <div className="pt-20 md:pt-6 pb-6">
                {chat.map((msg, i) => (
                  <div key={i} className={`py-8 px-4 group animate-in fade-in slide-in-from-bottom-2 duration-500 ${msg.role === 'user' ? 'bg-transparent' : 'bg-[#FFBE98]/[0.02] backdrop-blur-md border-y border-[#FFBE98]/10 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'}`}>
                    <div className="max-w-4xl mx-auto flex gap-4 md:gap-6 relative">
                      <div className="shrink-0 mt-1">
                        {msg.role === 'user' ? (
                          <div className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-gray-300 border border-white/10 shadow-inner">
                            {user ? user.email.charAt(0).toUpperCase() : <User size={18} />}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFBE98] to-[#F9A48C] flex items-center justify-center text-[#201B1A] shadow-[0_0_20px_rgba(255,190,152,0.4)]"><Bot size={20} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm mb-2 flex justify-between items-center">
                          <span className={msg.role === 'user' ? 'text-gray-300' : 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE98] to-[#F9A48C]'}>
                            {msg.role === 'user' ? (user ? 'You (Pro)' : 'You (Guest)') : 'Athlos AI'}
                          </span>
                        </div>

                        {msg.image && (
                          <div className="mb-3">
                            <img src={msg.image} alt="User Uploaded" className="max-w-[250px] md:max-w-sm max-h-64 rounded-xl border border-[#444] object-contain" />
                          </div>
                        )}

                        {msg.text === '' && loading && i === chat.length - 1 ? (
                          <div className="flex items-center h-6 gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        ) : (
                          <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-[15px] text-gray-200 overflow-x-auto relative">
                            {msg.role === 'assistant' && renderAutoPilotPlan(msg.text) ? (
                               renderAutoPilotPlan(msg.text)
                            ) : (
                               <MemoizedMarkdown text={msg.text} openCanvas={setCanvasState} onEditImage={handleOpenStudioForEdit} />
                            )}
                            {loading && i === chat.length - 1 && msg.text !== '' && (
                              <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse align-middle rounded-sm"></span>
                            )}
                          </div>
                        )}

                        {msg.role === 'assistant' && msg.text && msg.text.includes('image.pollinations.ai') && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              onClick={() => {
                                let extractedPrompt = '';
                                const match = msg.text.match(/\/prompt\/([^?)\s]+)/);
                                if (match && match[1]) {
                                  try { extractedPrompt = decodeURIComponent(match[1]); } catch { extractedPrompt = match[1]; }
                                }
                                const urlMatch = msg.text.match(/(https?:\/\/image\.pollinations\.ai\/prompt\/[^\s)]+)/);
                                handleOpenStudioForEdit(extractedPrompt, urlMatch ? urlMatch[1] : null);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/35 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <Palette size={14} className="text-[#FFBE98]" /> Kustomisasi Gambar di Studio Real-time
                            </button>
                          </div>
                        )}

                        {/* Interaction & Feature 51 & 52 */}
                        {msg.role === 'assistant' && msg.text && (
                          <div>
                            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-start items-center gap-3">
                              <button onClick={() => handleReadAloud(msg.text)} className="text-gray-400 hover:text-white transition-colors"><Volume2 size={16} /></button>
                              <CopyButton text={msg.text} />
                              <button onClick={() => handleExportPPT(msg.text)} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1" title="Export to PPTX">
                                <Presentation size={16} /> <span className="text-[10px] uppercase font-bold tracking-wider">PPT</span>
                              </button>
                              <div className="w-px h-4 bg-gray-700 mx-1"></div>
                              {/* Feature 51 */}
                              <FeedbackButton icon={ThumbsUp} type="up" />
                              <FeedbackButton icon={ThumbsDown} type="down" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-10 w-full shrink-0" />
              </div>
            )}
          </div>

          {showScrollButton && (
            <button onClick={scrollToBottom} className="absolute bottom-28 left-1/2 transform -translate-x-1/2 p-2 bg-[#333] hover:bg-[#555] text-white rounded-full border border-[#555] shadow-xl transition-all z-20">
              <ArrowDown size={18} />
            </button>
          )}

          <div className="w-full bg-[#161312] pt-3 pb-3 md:pt-4 md:pb-6 px-3 md:px-0 z-20 shrink-0 border-t border-white/5">
            <div className="max-w-3xl mx-auto relative group">

              {showTemplates && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#2f2f2f] border border-[#444] rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-2 border-b border-[#444] text-xs font-semibold text-gray-400 flex justify-between items-center bg-[#333]">
                    <span>Prompt Library</span>
                    <button onClick={() => setShowTemplates(false)} className="hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {PROMPT_TEMPLATES.map((tmpl, i) => (
                      <button key={i} onClick={() => { setInput(tmpl.text); setShowTemplates(false); inputRef.current?.focus(); }} className="w-full text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white p-2 rounded transition-colors mb-1 flex items-center gap-3 overflow-hidden" title={tmpl.text}>
                        <span className="text-xl shrink-0">{tmpl.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-[10px] text-gray-400 uppercase leading-none mb-1">{tmpl.category}</div>
                          <div className="truncate text-xs">{tmpl.text}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isUserBanned && (
                <div className="w-full bg-red-500/20 border border-red-500/50 text-red-400 text-sm py-2 px-4 text-center rounded-2xl mb-2 flex items-center justify-center gap-2">
                  <ShieldAlert size={16} /> Akun Anda telah diblokir oleh Admin dan tidak dapat mengirim pesan.
                </div>
              )}

              <div className="flex items-end bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden focus-within:border-[#F9A48C]/50 focus-within:bg-white/10 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative flex-col mx-2 md:mx-0">

                {/* Fitur 21: Image Preview */}
                {selectedImage && (
                  <div className="w-full p-3 pb-0">
                    <div className="relative inline-block">
                      <img src={selectedImage} alt="Preview" className="h-20 md:h-24 object-contain rounded-lg border border-[#555] bg-black" />
                      <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 text-gray-400 hover:text-red-500 bg-[#222] rounded-full p-0.5"><XCircle size={18} /></button>
                    </div>
                  </div>
                )}

                <div className="flex items-end w-full min-h-[56px] py-1.5">
                  <div className="flex items-center gap-0.5 md:gap-1 pl-2 mb-1.5">
                    <button onClick={() => setShowTemplates(!showTemplates)} className={`p-2 rounded-full transition-colors ${showTemplates ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Prompt Library"><Sparkles size={20} strokeWidth={1.5} /></button>
                    <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full transition-colors ${selectedImage ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Unggah Gambar"><ImageIcon size={20} strokeWidth={1.5} /></button>
                    <button onClick={() => setShowCameraModal(true)} className="p-2 rounded-full text-gray-400 hover:text-[#FFBE98] hover:bg-[#FFBE98]/10 transition-colors" title="Ambil Foto Kamera"><Camera size={20} strokeWidth={1.5} /></button>
                    <button onClick={() => { setStudioReferencePhoto(null); setStudioInitialPrompt(''); setShowImageStudio(true); }} className="p-2 rounded-full text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors" title="Studio Gambar Real-time"><Palette size={20} strokeWidth={1.5} /></button>
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                  </div>

                  <textarea
                    ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    placeholder={isUserBanned ? "Akun Diblokir" : (!user && guestChatCount >= 5 ? "Batas gratis habis. Login." : "Pesan Athlos AI...")}
                    className="flex-1 bg-transparent py-2.5 px-3 md:px-4 outline-none text-white text-[14px] md:text-[15px] placeholder-gray-500 resize-none max-h-[120px] overflow-y-auto block leading-relaxed self-center"
                    rows={1}
                    disabled={isUserBanned || (!user && guestChatCount >= 5) || loading}
                    style={{ minHeight: '44px' }}
                  />

                  <div className="pr-2 mb-1.5 flex items-center">
                    {loading ? (
                      <button onClick={stopGenerating} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Stop generating">
                        <Square size={18} fill="currentColor" strokeWidth={0} />
                      </button>
                    ) : (
                      <button onClick={() => sendChat()} disabled={(!input.trim() && !selectedImage) || (!user && guestChatCount >= 5) || isUserBanned} className="p-2.5 rounded-full bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] disabled:from-white/5 disabled:to-white/5 disabled:text-gray-500 transition-all hover:shadow-[0_0_15px_rgba(255,190,152,0.4)] hover:scale-105 active:scale-95 disabled:scale-100 disabled:shadow-none">
                        <Send size={18} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-gray-500 mt-2 px-2 gap-2 text-center md:text-left">
                <span className="hidden md:inline">{t.disclaimer}</span>
                <span className="md:hidden opacity-80">{t.disclaimer.split('.')[0]}.</span>
                <span className="flex flex-wrap justify-center items-center gap-1.5 md:gap-2">
                  <select value={aiEngine} onChange={e => setAiEngine(e.target.value)} className="bg-transparent border border-[#555] rounded px-1 outline-none text-gray-400 py-0.5">
                    <option value="gemini">Gemini</option>
                  </select>
                  <label className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={factCheck} onChange={e => setFactCheck(e.target.checked)} className="accent-[#FFBE98]" />
                    <span title="Multi-Agent Fact Checker">Fakta</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer hover:text-blue-400 transition-colors text-blue-400/80">
                    <input type="checkbox" checked={autoPilot} onChange={e => setAutoPilot(e.target.checked)} className="accent-blue-500" />
                    <span title="Autonomous Planner (Mendekomposisi Tugas)">Auto-Pilot 🚀</span>
                  </label>
                  <span className="text-gray-600 hidden sm:inline">|</span>
                  <span className="hidden sm:inline">{input.length} chars</span><span className="text-gray-600 hidden sm:inline">|</span>
                  <span className="font-mono bg-[#2f2f2f] px-1.5 py-0.5 rounded text-[10px] hidden sm:inline">~{Math.ceil(input.length / 4)} tokens</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Artifacts / Canvas Pane */}
        {canvasState && (
          <>
            {/* Desktop Canvas Pane */}
            <div className="hidden md:flex flex-col flex-1 min-w-0 h-screen bg-[#1a1a1a] transition-all relative z-10">
              <div className="h-14 min-h-[56px] border-b border-[#333] flex items-center justify-between px-4 text-white bg-[#252525]">
                 <div className="flex items-center gap-2">
                    {canvasState.type === 'html' ? <Play size={18} className="text-green-400" /> : <Code size={18} className="text-blue-400" />}
                    <span className="font-medium text-sm text-gray-200 tracking-wide">{canvasState.type === 'html' ? 'UI Preview' : `Code Artifact (${canvasState.language})`}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <CopyButton text={canvasState.content} />
                   <button onClick={() => setCanvasState(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                 {canvasState.type === 'html' ? (
                   <iframe srcDoc={canvasState.content} className="w-full h-full bg-white border-0" title="HTML Preview" sandbox="allow-scripts allow-modals allow-forms allow-popups" />
                 ) : (
                   <SyntaxHighlighter style={vscDarkPlus} language={canvasState.language} PreTag="div" className="!m-0 !bg-transparent !p-6 min-h-full text-[15px] leading-relaxed" showLineNumbers={true}>
                     {canvasState.content}
                   </SyntaxHighlighter>
                 )}
              </div>
            </div>
            
            {/* Mobile Canvas Modal */}
            <div className="md:hidden fixed inset-0 z-[60] bg-black/90 flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="h-14 min-h-[56px] border-b border-gray-700 flex items-center justify-between px-4 text-white bg-[#212121]">
                 <div className="flex items-center gap-2">
                    {canvasState.type === 'html' ? <Play size={18} className="text-green-400" /> : <Code size={18} className="text-blue-400" />}
                    <span className="font-medium text-sm text-gray-200">{canvasState.type === 'html' ? 'UI Preview' : `Code Artifact (${canvasState.language})`}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <CopyButton text={canvasState.content} />
                   <button onClick={() => setCanvasState(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"><X size={24} /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                 {canvasState.type === 'html' ? (
                   <iframe srcDoc={canvasState.content} className="w-full h-full bg-white border-0" title="HTML Preview" sandbox="allow-scripts allow-modals allow-forms allow-popups" />
                 ) : (
                   <SyntaxHighlighter style={vscDarkPlus} language={canvasState.language} PreTag="div" className="!m-0 !bg-transparent !p-4 min-h-full text-[14px]" showLineNumbers={true}>
                     {canvasState.content}
                   </SyntaxHighlighter>
                 )}
              </div>
            </div>
          </>
        )}
        </>
      )}
    </div>
  );
}
