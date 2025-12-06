import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Konva is loaded via script tag and shimmed in importmap, but we import it here to satisfy potential TS checks or side effects if needed.
import Konva from 'konva';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <App />
);