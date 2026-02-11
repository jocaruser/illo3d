import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import App from './App';
import './index.css';

const root = document.getElementById('root')!;
const stored = localStorage.getItem('illo3d-theme');
const theme = stored === 'dark' || stored === 'light' ? stored : 'dark';
root.closest('html')?.setAttribute('data-theme', theme);

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
