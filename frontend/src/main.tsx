import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/ThemeProvider.tsx'
import { registerSW } from 'virtual:pwa-register'

const queryClient = new QueryClient()
const APP_VERSION = __APP_VERSION__
const IS_PROD = import.meta.env.PROD

const clearStaleCaches = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((reg) => reg.unregister().catch(() => undefined))
    )
  }
  if ('caches' in window) {
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => undefined)
  }
}

const ensureFreshVersion = () => {
  if (!IS_PROD) return
  try {
    const storedVersion = localStorage.getItem('app_version')
    if (storedVersion && storedVersion !== APP_VERSION) {
      clearStaleCaches()
    }
    localStorage.setItem('app_version', APP_VERSION)
  } catch (error) {
    console.warn('Falha ao validar versao do app no cache, prosseguindo com recarregamento limpo.', error)
  }
}

const setupServiceWorker = () => {
  if (!('serviceWorker' in navigator) || !IS_PROD) return

  const updateSW = registerSW({
    immediate: true,
    onRegistered: (registration) => {
      registration?.update().catch(() => undefined)
    },
    onNeedRefresh: () => {
      updateSW?.(true)
    },
    onRegisterError: (error) => {
      console.error('Falha ao registrar o service worker, limpando caches antigos.', error)
      clearStaleCaches()
    },
  })

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

ensureFreshVersion()
setupServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
