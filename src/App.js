/*
 * Componente Principal de Rutas (App.js)
 * Aquí defino todas las rutas de la aplicación
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Mis Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute'; 
import ProcessDetailPage from './pages/ProcessDetailPage'; 
import ChatGeneralPage from './pages/ChatGeneralPage';
import PrivateChatPage from './pages/PrivateChatPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './components/AdminRoute'; 
import AdminUsersPage from './pages/AdminUsersPage'; 

function App() {
  return (
    <div className="App">
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- RUTAS PRIVADAS (PROTEGIDAS) --- */}
        <Route path="/" element={<ProtectedRoute />}>
          {/* Rutas para todos los roles logueados */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/process/:id" element={<ProcessDetailPage />} />
          <Route path="/chat/general" element={<ChatGeneralPage />} />
          <Route path="/chat/:conversationId" element={<PrivateChatPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* --- RUTAS SOLO PARA ADMIN --- */}
          {/* Envolvemos las rutas de admin en el AdminRoute */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route path="users" element={<AdminUsersPage />} />
            {/* Aquí podrías añadir más rutas de admin en el futuro,
                como /admin/settings, etc. */}
          </Route>
          
        </Route>

        {/* Ruta 'catch-all' para cualquier URL que no coincida (404) */}
        <Route path="*" element={
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>404 - Página no encontrada</h2>
            <p>La ruta que buscas no existe.</p>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;