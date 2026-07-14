import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SpaRoot from './seo/SpaRoot.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpaRoot />
  </StrictMode>,
);
