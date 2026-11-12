import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const start = () =>
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

// The demo build answers API calls in the browser with sample data (see src/demo).
if (import.meta.env.VITE_DEMO === 'true') import('./demo/install.js').then(start);
else start();
