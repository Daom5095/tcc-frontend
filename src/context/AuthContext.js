/*
 * Contexto de Autenticación (AuthContext.js)
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; 
// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos el Proveedor (Provider)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando el token

  // 3. useEffect para cargar el usuario 
  useEffect(() => {
    async function loadUserFromToken() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user); 
        } catch (error) {
          console.error("Token inválido, limpiando.");
          localStorage.removeItem('token');
          setUser(null); 
        }
      }
      setLoading(false);
    }
    loadUserFromToken();
  }, []);

  // 4. Función de Login 
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  // 5. Función de Registro 
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  // 6. Función de Logout 
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // --- 7. 
  // Para actualizar el estado del usuario desde otras páginas 
  const updateUserContext = (newUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...newUserData
    }));
  };


  // 8. Exponemos los valores y funciones a toda la app
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

// 9. Hook personalizado
export const useAuth = () => {
  return useContext(AuthContext);
};