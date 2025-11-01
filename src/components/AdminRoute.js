/*
 * Componente de Ruta Protegida para Administradores (AdminRoute.js)
 * Creado para (FASE 3 - PASO 9)
 *
 * Este componente es un guardián DOBLE:
 * 1. Verifica que el usuario esté logueado (como ProtectedRoute).
 * 2. Verifica que el usuario tenga el rol de 'admin'.
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin, Layout } from 'antd'; // Usamos Spin para el estado de carga

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    // Muestra un spinner de carga mientras se verifica el token
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  if (!user) {
    // Si la carga terminó y NO hay usuario,
    // lo redirijo a /login.
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    // Si hay usuario, PERO NO es admin,
    // lo redirijo al dashboard principal.
    return <Navigate to="/" replace />;
  }

  // Si la carga terminó, hay usuario Y es 'admin',
  // muestro el contenido de la ruta anidada (AdminUsersPage)
  return <Outlet />;
}

export default AdminRoute;