import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const rawBase = import.meta.env.BASE_URL || '/'
const routerBase = rawBase.endsWith('/') && rawBase.length > 1 ? rawBase.slice(0, -1) : rawBase

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={routerBase}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
