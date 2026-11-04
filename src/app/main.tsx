import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { solicitarPersistencia } from '../db/persist'
import '../index.css'
import App from './App.tsx'

void solicitarPersistencia()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
