import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Importamos nuestro api de axios

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos el Proveedor (Provider)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando el token

  // 3. useEffect para cargar el usuario al iniciar la app
  useEffect(() => {
    async function loadUserFromToken() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Si hay token, pedimos al backend la ruta /auth/me
          const { data } = await api.get('/auth/me');
          setUser(data.user); // Guardamos el usuario en el estado
        } catch (error) {
          console.error("Token inválido, limpiando.");
          localStorage.removeItem('token'); // Limpiamos token si es inválido
        }
      }
      setLoading(false);
    }
    loadUserFromToken();
  }, []);

  // 4. Función de Login
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    
    // Guardamos el token y el usuario
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  // 5. Función de Registro
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });

    // Guardamos token y usuario (igual que el login)
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  // 6. Función de Logout
  const logout = () => {
    // Limpiamos todo
    localStorage.removeItem('token');
    setUser(null);
  };

  // 7. Exponemos los valores a toda la app
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 8. Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};