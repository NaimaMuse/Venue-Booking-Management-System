import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

window.addEventListener('error', (event) => {
  console.error('Window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  rootElement.innerHTML = `<pre style="padding:24px;color:#a33a4a;white-space:pre-wrap">${String(
    error?.stack || error
  )}</pre>`;
}
