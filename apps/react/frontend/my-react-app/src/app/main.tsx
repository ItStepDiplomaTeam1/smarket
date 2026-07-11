import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '../index.css'
import { AppRouter } from './routes/Router'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/shared/context/ThemeContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || 'missing-client-id'

try {
  sessionStorage.removeItem('smarket-chunk-reload-retry');
} catch (e) {
  console.warn('Failed to access sessionStorage:', e);
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <AppRouter />
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </StrictMode>
  </ThemeProvider>,
)
