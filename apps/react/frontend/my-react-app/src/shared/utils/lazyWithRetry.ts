import { lazy, type ComponentType } from 'react';

/**
 * A wrapper around React.lazy that automatically attempts to reload the page
 * when a chunk load error occurs (typically due to a new deployment replacing files).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error) => {
      const errorMessage = error?.message || error?.statusText || String(error);
      const isChunkLoadFailed =
        errorMessage &&
        (/failed to fetch/i.test(errorMessage) ||
          /dynamically imported module/i.test(errorMessage) ||
          /importing a module script failed/i.test(errorMessage));

      if (isChunkLoadFailed) {
        const RELOAD_KEY = 'smarket-chunk-reload-timestamp';
        const lastReload = sessionStorage.getItem(RELOAD_KEY);
        const isRecentReload = lastReload && (Date.now() - Number(lastReload) < 15000);

        if (!isRecentReload) {
          try {
            sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          } catch (e) {
            console.warn('Failed to set sessionStorage:', e);
          }

          const url = new URL(window.location.href);
          url.searchParams.set('_r', String(Date.now()));
          window.location.replace(url.toString());

          // Return a pending promise so the app stays in the fallback loading state while refreshing
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw error;
    })
  );
}
