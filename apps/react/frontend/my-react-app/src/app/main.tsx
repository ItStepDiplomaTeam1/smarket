import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '../index.css'
import { AppRouter } from './routes/Router'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './providers/ThemeProvider'
import { AuthBootstrap } from '@/modules/Auth/components/AuthBootstrap'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || 'missing-client-id'

window.addEventListener('error', (e) => {
  const message = e?.message;
  if (!message) return;

  const isChunkError =
    /failed to fetch/i.test(message) ||
    /dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message);

  if (isChunkError) {
    const RELOAD_KEY = 'smarket-chunk-reload-timestamp';
    const lastReload = sessionStorage.getItem(RELOAD_KEY);
    const isRecentReload = lastReload && (Date.now() - Number(lastReload) < 15000);

    if (!isRecentReload) {
      try {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch (err) {
        console.warn('Failed to set sessionStorage:', err);
      }
      const url = new URL(window.location.href);
      url.searchParams.set('_r', String(Date.now()));
      window.location.replace(url.toString());
    }
  }
}, true);

try {
  sessionStorage.removeItem('smarket-chunk-reload-retry');
} catch (e) {
  console.warn('Failed to access sessionStorage:', e);
}

try {
  // Clean up cache-buster parameter from URL if present
  const url = new URL(window.location.href);
  if (url.searchParams.has('_r')) {
    url.searchParams.delete('_r');
    window.history.replaceState({}, '', url.pathname + url.search);
  }
} catch (e) {
  console.warn('Failed to clean up URL:', e);
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthBootstrap>
            <AppRouter />
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
          </AuthBootstrap>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
