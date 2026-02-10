import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root')!;
const stored = localStorage.getItem('illo3d-theme');
if (stored === 'dark' || stored === 'light') {
  root.closest('html')?.setAttribute('data-theme', stored);
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
