import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    // Muestra un 'cargando...' mientras verifica el token
    return <div>Cargando...</div>;
  }

  if (!user) {
    // Si no hay usuario, redirige a /login
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, muestra el contenido (el Dashboard)
  return <Outlet />;
}

export default ProtectedRoute;