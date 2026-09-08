import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthContext'
import { isPublicRoute } from '@/utils/routes'

const app = isPublicRoute(window.location.pathname) ? (
  <App />
) : (
  <AuthProvider>
    <App />
  </AuthProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {app}
  </StrictMode>,
)
