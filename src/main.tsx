import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRouter from './router';
import { Toaster } from 'react-hot-toast';
import { LoadingProvider } from './context/LoadingContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoadingProvider>
      <AppRouter />
      <Toaster position="top-right" />
    </LoadingProvider>
  </React.StrictMode>
);
