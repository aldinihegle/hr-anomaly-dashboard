import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster 
        position="top-right" 
        richColors 
        toastOptions={{
          style: { padding: '16px 20px', fontSize: '15px', minWidth: '320px' }
        }}
      />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
