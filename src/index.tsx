import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/pages/App/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento root');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);