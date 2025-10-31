/*
 * Componente Principal de Rutas (App.js)
 *
 * Aquí defino la estructura de navegación de mi aplicación
 * usando React Router.
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
import ReportsPage from './pages/ReportsPage'; // La página de reportes

function App() {
  return (
    <div className="App">
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- RUTAS PRIVADAS (PROTEGIDAS) --- */}
        <Route path="/" element={<ProtectedRoute />}>
          {/* Ruta principal al Dashboard */}
          <Route path="/" element={<DashboardPage />} />
          
          {/* Ruta para el detalle de proceso */}
          <Route path="/process/:id" element={<ProcessDetailPage />} />
          
          {/* Rutas de Chat */}
          <Route path="/chat/general" element={<ChatGeneralPage />} />
          <Route path="/chat/:conversationId" element={<PrivateChatPage />} />
          
          {/* Ruta de Reportes */}
          <Route path="/reports" element={<ReportsPage />} />
          
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