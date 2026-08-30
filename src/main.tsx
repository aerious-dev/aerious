import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Aerious } from './Aerious';
import './aerious.css';

// For the engineers who read source.
console.log(
  '%cÆRIOUS\n%cfrom aer, Latin for air. admin@aerious.co',
  'font-size: 14px; letter-spacing: 2px; color: #fafafa;',
  'color: #7a7a7a;',
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Aerious />
  </StrictMode>,
);
