'use client';
import { useEffect } from 'react';

export default function AntiDebugGuard() {
  useEffect(() => {
    // 1. Blokir shortcut keyboard DevTools & View Source
    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect/Console/Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 2. Blokir Klik Kanan (Context Menu) di luar input teks
    const handleContextMenu = (e) => {
      if (e.target && ['TEXTAREA', 'INPUT'].includes(e.target.tagName)) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // 3. Deteksi DevTools via Timing & Window Dimensions
    let devtoolsOpen = false;
    const threshold = 160;
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.clear();
          console.log(
            '%c⚠️ PERINGATAN KEAMANAN ATHLOS AI',
            'color: #FFBE98; font-size: 20px; font-weight: bold; background: #201B1A; padding: 6px 12px; border-radius: 6px;'
          );
          console.log(
            '%cArea ini diproteksi. Dilarang melakukan reverse engineering, modifikasi payload, atau injeksi script.',
            'color: #ff6b6b; font-size: 13px;'
          );
        }
      } else {
        devtoolsOpen = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    const interval = setInterval(checkDevTools, 1500);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      clearInterval(interval);
    };
  }, []);

  return null;
}
