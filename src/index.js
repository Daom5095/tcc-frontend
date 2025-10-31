/*
 * Archivo de entrada principal (index.js)
 *
 * Este es el punto de entrada de React.
 * Aquí renderizo mi componente 'App' principal y lo envuelvo
 * con todos los proveedores de contexto necesarios.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Mis estilos globales
import App from './App'; // Mi componente principal de rutas
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Mi contexto de sesión
import { SocketProvider } from './context/SocketContext'; // Mi contexto de sockets

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode ayuda a detectar problemas en desarrollo
  <React.StrictMode>
    {/* BrowserRouter habilita el ruteo en la app */}
    <BrowserRouter>
      {/* AuthProvider maneja el estado del usuario */}
      <AuthProvider>
        {/*
         * SocketProvider va DENTRO de AuthProvider
         * para que pueda saber quién es el usuario y cuándo conectarse/desconectarse.
         */}
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);