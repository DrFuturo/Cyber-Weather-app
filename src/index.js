import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

console.log("index.js is running");

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log("Root element found:", root);

root.render(<App />);
console.log("App rendered");
