import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { AppRouter } from './router.tsx';
import '@mantine/core/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <AppRouter />
    </MantineProvider>
  </StrictMode>
);
