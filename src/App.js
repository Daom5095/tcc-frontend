import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute'; // Importamos la ruta protegida

function App() {
  return (
    <div className="App">
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* RUTAS PRIVADAS */}
        {/* Usamos ProtectedRoute para envolver el Dashboard */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          
          {/* 
            
          */}
          {/* <Route path="/process/:id" element={<ProcessDetailPage />} /> */}
          
        </Route>

        {/* Ruta para cualquier otra cosa (404) */}
        <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
      </Routes>
    </div>
  );
}

export default App;