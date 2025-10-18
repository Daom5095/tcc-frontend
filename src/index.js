import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; // <-- AÑADIR ESTA LÍNEA

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Envolvemos la App con el SocketProvider, dentro de AuthProvider */}
        <SocketProvider>  {/* <-- AÑADIR ESTA LÍNEA */}
          <App />
        </SocketProvider> {/* <-- AÑADIR ESTA LÍNEA */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);