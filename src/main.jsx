import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ToastViewport } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/ConfirmDialog'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConfirmProvider>
        <App />
        <ToastViewport />
      </ConfirmProvider>
    </BrowserRouter>
  </StrictMode>,
)
