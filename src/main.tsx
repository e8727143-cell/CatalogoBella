import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installLogCapture, logInfo } from './lib/logger';

installLogCapture();
logInfo('App iniciada', { ruta: window.location.pathname, ancho: window.innerWidth });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
