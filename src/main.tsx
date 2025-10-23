import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// StrictMode temporarily disabled to show production-like request count
createRoot(document.getElementById('root')!).render(
  <App />
);
