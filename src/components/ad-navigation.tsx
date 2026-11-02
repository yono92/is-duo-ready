'use client';

import { createContext, useContext, useEffect } from 'react';

const DocumentNavigation = createContext(false);

export function useDocumentNavigation() {
  return useContext(DocumentNavigation);
}

// Auto ads own document-level DOM and timers. A new document also clears them
// when opening a policy, administrator, empty-result or error page.
export function AdNavigation({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!enabled) return;
    function navigate(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (
        !anchor ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return;
      const destination = new URL(anchor.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
          destination.search === window.location.search)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(destination.href);
    }
    document.addEventListener('click', navigate, true);
    return () => document.removeEventListener('click', navigate, true);
  }, [enabled]);

  return <DocumentNavigation.Provider value={enabled}>{children}</DocumentNavigation.Provider>;
}
