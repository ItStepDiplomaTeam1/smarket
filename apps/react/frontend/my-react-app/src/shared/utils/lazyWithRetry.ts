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
      const isChunkLoadFailed =
        error.message &&
        (/failed to fetch/i.test(error.message) ||
          /dynamically imported module/i.test(error.message) ||
          /importing a module script failed/i.test(error.message));

      if (isChunkLoadFailed) {
        const RELOAD_KEY = 'smarket-chunk-reload-retry';
        const hasReloaded = sessionStorage.getItem(RELOAD_KEY);

        if (!hasReloaded) {
          sessionStorage.setItem(RELOAD_KEY, 'true');
          window.location.reload();
          // Return a pending promise so the app stays in the fallback loading state while refreshing
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw error;
    })
  );
}
