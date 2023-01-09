import React from 'react';
import ReactDOM from 'react-dom/client';
import { EnsureKontentAsParent } from "./EnsureKontentAsParent";
import { ChatSonicApp } from './ChatSonicApp';
import "./index.css";

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Cannot find the root element. Please, check your html.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <EnsureKontentAsParent>
      <ChatSonicApp/>
    </EnsureKontentAsParent>
  </React.StrictMode>
);
