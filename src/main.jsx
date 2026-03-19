import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { globalCss } from './tokens.js';

const styleTag = document.createElement('style');
styleTag.innerHTML = globalCss;
document.head.appendChild(styleTag);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

