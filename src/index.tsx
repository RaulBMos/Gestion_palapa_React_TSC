import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/pages/App/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento root');
}

import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);