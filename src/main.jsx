import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ToastViewport } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/ConfirmDialog'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <App />
          <ToastViewport />
        </ConfirmProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
