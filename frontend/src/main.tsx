import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/ThemeProvider.tsx'
import { registerSW } from 'virtual:pwa-register'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

registerSW({
  immediate: true,
  onRegisteredSW: (swUrl) => {
    console.log('SW registered:', swUrl)
  },
  onRegisterError: (error) => {
    console.log('SW registration failed:', error)
  },
})
