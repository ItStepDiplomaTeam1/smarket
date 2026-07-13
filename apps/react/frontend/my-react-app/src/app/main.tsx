import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '../index.css'
import { AppRouter } from './routes/Router'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './providers/ThemeProvider'

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
    const url = new URL(window.location.href);
    url.searchParams.set('_r', String(Date.now()));
    window.location.replace(url.toString());
  }
}, true);

try {
  sessionStorage.removeItem('smarket-chunk-reload-retry');
} catch (e) {
  console.warn('Failed to access sessionStorage:', e);
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppRouter />
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
