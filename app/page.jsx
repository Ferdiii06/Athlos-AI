'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import ThreeBackground from './components/ThreeBackground';
import { Sparkles, ArrowRight, Bot, Code, Zap, Shield, Bug, Wrench, TestTube, Database, Languages, Regex, GitBranch, Layout, Network, ServerCrash, CheckCircle2, Box, MessageSquare, LayoutTemplate, Globe, Command, Cpu } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

const phrases = ["Code Automation.", "QA Acceleration.", "Design Generation."];

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef(null);
  
  // Typewriter State
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      setTypedText(
        isDeleting
          ? fullText.substring(0, typedText.length - 1)
          : fullText.substring(0, typedText.length + 1)
      );

      setTypingSpeed(isDeleting ? 50 : 100);

      if (!isDeleting && typedText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };
    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [typedText, isDeleting, loopNum, typingSpeed, phrases]);
  
  useGSAP(() => {
    // 1. Initial Hero Reveal (Staggered)
    const tl = gsap.timeline();
    
    tl.from('.nav-item', {
      y: -20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'back.out(1.5)'
    })
    .from('.bento-box', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.2');

    // Background blobs have been replaced with ThreeBackground

    // 5. Features Grid Stagger
    gsap.from('.feature-card', {
      y: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: '#features',
        start: 'top 80%',
      }
    });

    // 6. Pricing Cards Reveal
    gsap.from('.pricing-card', {
      y: 50, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out',
      scrollTrigger: { trigger: '#pricing', start: 'top 85%' }
    });

    // 7. Integrations Grid Float
    gsap.to('.integration-grid > div', {
      y: -10,
      duration: 2,
      stagger: {
        each: 0.2,
        repeat: -1,
        yoyo: true
      },
      ease: 'sine.inOut'
    });
    
    // 8. Magnetic Button Effect setup
    const magneticButtons = document.querySelectorAll('.magnetic');
    magneticButtons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.4,
          ease: 'power2.out'
        });
      });
      
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.3)'
        });
      });
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#201B1A] text-gray-100 font-sans selection:bg-[#FFBE98]/30 overflow-x-hidden relative">
      
      {/* 3D Immersive Background */}
      <ThreeBackground />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 w-full z-50 border-b border-white/5 bg-[#201B1A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="nav-item flex items-center gap-2 font-bold text-xl tracking-tight">
            <img src="/Athlos AI.png" alt="Athlos AI Logo" className="w-8 h-8 object-contain" />
            Athlos <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE98] to-[#F9A48C]">AI</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/chat" className="nav-item text-sm font-medium text-gray-300 hover:text-[#FFBE98] transition-colors">
              Login
            </Link>
            <Link href="/chat" className="nav-item text-sm font-medium text-gray-300 hover:text-[#FFBE98] transition-colors hidden md:block">
              Sign Up
            </Link>
            <Link href="/chat" className="nav-item magnetic inline-flex items-center justify-center text-sm font-bold bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] px-4 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(255,190,152,0.4)] transition-all">
              Start Chatting
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 md:pt-32 pb-20 overflow-hidden">
        {/* BENTO BOX GRID HERO */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto z-20 relative">
          
          {/* Box 1: Core Hero (Span 3 cols, 2 rows) */}
          <div className="bento-box lg:col-span-3 lg:row-span-2 bg-[#2f2f2f]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFBE98]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFBE98]/10 border border-[#FFBE98]/20 text-[#FFBE98] text-xs font-semibold mb-6 uppercase tracking-widest w-fit">
              <Sparkles size={14} /> AI Developer Assistant
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-3xl leading-[1.1] z-10">
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE98] via-[#F9A48C] to-[#E8A87C]">
                {typedText}<span className="animate-pulse text-[#FFBE98]">|</span>
              </div>
              <div className="mt-2 text-white">
                Enterprise Scale.
              </div>
            </h1>
            
            <p className="hero-desc text-lg text-gray-400 max-w-xl mb-8 leading-relaxed z-10">
              An advanced artificial intelligence platform designed to accelerate your software development lifecycle and workflow automation.
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row items-center gap-4 z-10">
              <Link href="/chat" className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] px-8 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(255,190,152,0.4)] transition-all w-full sm:w-auto hover:scale-105 active:scale-95">
                Start Exploring <ArrowRight size={20} className="ml-1" />
              </Link>
              <a href="#features" className="flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all w-full sm:w-auto">
                Documentation
              </a>
            </div>
          </div>

          {/* Box 2: Terminal (Span 1 col, 2 rows) */}
          <div className="bento-box lg:col-span-1 lg:row-span-2 bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative group">
            <div className="h-10 bg-[#1a1a1a] flex items-center px-4 gap-2 border-b border-white/5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="p-5 font-mono text-[11px] sm:text-xs text-green-400 flex-1 flex flex-col gap-3 relative z-10">
              <div><span className="text-pink-500">➜</span> <span className="text-cyan-400">~</span> npx athlos init</div>
              <div className="text-gray-400">Loading Enterprise AI...</div>
              <div className="text-gray-300 flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> GPU Cluster Active</div>
              <div className="text-gray-300 flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> 50+ Languages Loaded</div>
              <div><span className="text-pink-500">➜</span> <span className="text-cyan-400">~</span> athlos generate</div>
              <div className="text-[#FFBE98] animate-pulse">Building architecture... █</div>
            </div>
            {/* Glow effect */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] group-hover:bg-green-500/20 transition-colors"></div>
          </div>

          {/* Box 3: App Showcase (Span 2 cols, 1 row) */}
          <div className="bento-box lg:col-span-2 lg:row-span-1 bg-gradient-to-br from-[#2f2f2f]/40 to-[#1A1615]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group flex items-center justify-between min-h-[220px]">
             <div className="z-10 max-w-[50%]">
                <h3 className="text-2xl font-bold text-white mb-2">Mobile Ready</h3>
                <p className="text-sm text-gray-400">Access your AI assistant securely from any device, anywhere.</p>
             </div>
             
             {/* Mini iPhone embedded */}
             <div className="absolute right-4 md:right-10 top-8 w-[140px] h-[300px] bg-[#1A1615] rounded-[2rem] border-[6px] border-[#222] shadow-[0_20px_40px_rgba(0,0,0,0.6)] overflow-hidden transform rotate-12 group-hover:rotate-6 group-hover:-translate-y-4 transition-transform duration-500">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#222] rounded-full z-20"></div>
                <div className="p-3 pt-8 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-tr from-[#FFBE98] to-[#F9A48C] rounded-full"></div>
                    <div className="w-16 h-2 bg-white/20 rounded"></div>
                  </div>
                  <div className="w-full h-16 bg-white/5 rounded-lg border border-white/10"></div>
                  <div className="w-3/4 h-12 bg-[#FFBE98]/20 rounded-lg ml-auto border border-[#FFBE98]/30"></div>
                </div>
             </div>
          </div>

          {/* Box 4: Stats (Span 1 col, 1 row) */}
          <div className="bento-box lg:col-span-1 lg:row-span-1 bg-[#2f2f2f]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center group hover:bg-[#2f2f2f]/60 transition-colors">
            <h3 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#FFBE98] to-[#F9A48C] mb-2 group-hover:scale-110 transition-transform">99.9%</h3>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Uptime SLA</p>
          </div>

          {/* Box 5: Integrations (Span 1 col, 1 row) */}
          <div className="bento-box lg:col-span-1 lg:row-span-1 bg-[#2f2f2f]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col justify-center group hover:bg-[#2f2f2f]/60 transition-colors">
            <p className="text-xs text-gray-400 text-center mb-4 uppercase tracking-wider font-semibold">Seamless Integrations</p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 group-hover:-translate-y-1 transition-transform"><Box size={18} /></div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:translate-y-1 transition-transform"><MessageSquare size={18} /></div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:-translate-y-1 transition-transform"><Globe size={18} /></div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FFBE98] group-hover:translate-y-1 transition-transform"><Command size={18} /></div>
            </div>
          </div>
          
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-40 pb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Enterprise-Scale AI Infrastructure</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">A comprehensive artificial intelligence architecture to automate your software development lifecycle.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Code className="text-[#FFBE98]" size={24} />, title: 'Code Generation', desc: 'Generate production-ready code in seconds for 50+ programming languages.' },
              { icon: <Bug className="text-[#F9A48C]" size={24} />, title: 'Bug Hunter & Debugging', desc: 'Automated error log analysis with highly accurate fix suggestions.' },
              { icon: <Wrench className="text-[#FFBE98]" size={24} />, title: 'Code Refactoring', desc: 'Modernize legacy code for optimal performance and readability.' },
              { icon: <TestTube className="text-[#F9A48C]" size={24} />, title: 'Unit Test Generator', desc: 'Automated generation of unit test frameworks like Jest, Mocha, and PyTest.' },
              { icon: <Database className="text-[#FFBE98]" size={24} />, title: 'Database Query Builder', desc: 'Convert natural language into complex SQL queries with high precision.' },
              { icon: <Languages className="text-[#F9A48C]" size={24} />, title: 'Code Translation', desc: 'Cross-language code migration while maintaining original architecture.' },
              { icon: <Regex className="text-[#FFBE98]" size={24} />, title: 'RegEx Wizard', desc: 'Instant creation and validation of Regular Expression patterns.' },
              { icon: <GitBranch className="text-[#F9A48C]" size={24} />, title: 'Git Assistant', desc: 'Automated commit descriptions and repository merge conflict resolutions.' },
              { icon: <Layout className="text-[#FFBE98]" size={24} />, title: 'UI/UX Code Export', desc: 'Export UI/UX components into ready-to-use React and Tailwind code.' },
              { icon: <Network className="text-[#F9A48C]" size={24} />, title: 'Architecture Planner', desc: 'Declarative text-based system architecture and topology design.' },
              { icon: <ServerCrash className="text-[#FFBE98]" size={24} />, title: 'Graceful Degradation', desc: 'High-availability system with graceful degradation protocols.' },
            ].map((f, i) => (
              <div key={i} className="feature-card bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-100">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>



        {/* Pricing Section */}
        <div id="pricing" className="mt-40 pb-32">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Global Scale Investment</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">Choose the plan that fits your enterprise growth.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {/* Free */}
            <div className="pricing-card bg-white/5 border border-white/10 p-8 rounded-3xl relative">
              <h3 className="text-xl font-bold text-gray-400 mb-2">Starter</h3>
              <div className="text-4xl font-extrabold mb-6">$0<span className="text-lg text-gray-500 font-medium">/mo</span></div>
              <ul className="space-y-4 mb-8 text-gray-300">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> 1000 lines of code / month</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> 3 Programming Languages</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> Community Support</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-bold text-white">Get Started for Free</button>
            </div>
            
            {/* Pro */}
            <div className="pricing-card bg-gradient-to-b from-[#FFBE98]/20 to-transparent border border-[#FFBE98]/50 p-8 rounded-3xl transform md:-translate-y-4 shadow-[0_0_50px_rgba(255,190,152,0.15)] relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] px-4 py-1 rounded-full text-xs font-bold">MOST POPULAR</div>
              <h3 className="text-xl font-bold text-[#FFBE98] mb-2">Pro Developer</h3>
              <div className="text-5xl font-extrabold mb-6 text-white">$29<span className="text-lg text-gray-500 font-medium">/mo</span></div>
              <ul className="space-y-4 mb-8 text-gray-100">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> Unlimited lines of code</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> Access to 50+ Languages</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> Auto-Debugging & Refactoring</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> Priority Email Support</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFBE98] to-[#F9A48C] text-[#201B1A] hover:shadow-[0_0_20px_rgba(255,190,152,0.4)] transition-all font-bold">Upgrade to Pro</button>
            </div>
            
            {/* Enterprise */}
            <div className="pricing-card bg-white/5 border border-white/10 p-8 rounded-3xl relative">
              <h3 className="text-xl font-bold text-gray-400 mb-2">Enterprise</h3>
              <div className="text-4xl font-extrabold mb-6">Custom</div>
              <ul className="space-y-4 mb-8 text-gray-300">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> Dedicated GPU Cluster</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> On-Premise Deployment</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#FFBE98]"/> SLA 99.99% Uptime</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-bold text-white">Contact Sales</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
