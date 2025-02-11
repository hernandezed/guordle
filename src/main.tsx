import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WordleClone from "./WordleClone.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WordleClone />
  </StrictMode>,
)
