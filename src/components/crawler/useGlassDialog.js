"use client";
import { useEffect } from 'react';

export function useGlassDialog(isOpen, panel, onClose, reduced) {
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const main = document.querySelector('main'), language = document.querySelector('.language-switcher');
    const mainInert = main?.inert, languageInert = language?.inert, overflow = document.body.style.overflow;
    if (main) main.inert = true; if (language) language.inert = true;
    document.body.style.overflow = 'hidden';
    const focus = setTimeout(() => (panel.current?.querySelector('[data-modal-autofocus]') || panel.current?.querySelector('[data-modal-close]'))?.focus({preventScroll:true}),reduced ? 80 : 400);
    function key(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const items = [...(panel.current?.querySelectorAll('button:not([disabled]), summary, a[href], [tabindex="0"]') || [])].filter(node => node.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown',key);
    return () => {
      clearTimeout(focus); document.body.style.overflow = overflow;
      if (main) main.inert = mainInert; if (language) language.inert = languageInert;
      document.removeEventListener('keydown',key); previousFocus?.focus?.({preventScroll:true});
    };
  },[isOpen,panel,onClose,reduced]);
}
