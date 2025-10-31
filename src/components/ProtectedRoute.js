/*
 * Componente de Ruta Protegida (ProtectedRoute.js)
 *
 * Este componente es un "guardián".
 * Utiliza el AuthContext para verificar si el usuario está autenticado.
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  // Obtengo el usuario y el estado de 'loading' de mi AuthContext
  const { user, loading } = useAuth();

  if (loading) {
    // Muestro un 'cargando...' mientras el AuthContext verifica el token
    // (en el useEffect de AuthContext)
    return <div>Cargando...</div>;
  }

  if (!user) {
    // Si la carga terminó y NO hay usuario,
    // lo redirijo a /login. 'replace' evita que pueda volver atrás.
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, muestro el contenido de la ruta anidada
  // (en mi caso, el DashboardPage)
  return <Outlet />;
}

export default ProtectedRoute;