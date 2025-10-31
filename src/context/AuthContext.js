/*
 * Contexto de Autenticación (AuthContext.js)
 *
 * Este es el "cerebro" de la sesión de usuario. Es un proveedor global
 * que maneja quién es el usuario, si está logueado, y provee las
 * funciones para 'login', 'register' y 'logout' a cualquier
 * componente que las necesite.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Importamos nuestro api de axios

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos el Proveedor (Provider)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando el token

  // 3. useEffect para cargar el usuario al iniciar la app
  // Esto se ejecuta solo una vez cuando la app carga
  useEffect(() => {
    async function loadUserFromToken() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Si hay token, pedimos al backend la ruta /auth/me
          // 'api' (axios) automáticamente adjuntará el token gracias al interceptor
          const { data } = await api.get('/auth/me');
          setUser(data.user); // Guardamos el usuario en el estado
        } catch (error) {
          // --- MEJORA DE ROBUSTEZ ---
          // Si el token es inválido (expirado, etc.), lo limpiamos
          console.error("Token inválido, limpiando.");
          localStorage.removeItem('token');
          setUser(null); // Aseguramos que el usuario sea nulo
        }
      }
      setLoading(false);
    }
    loadUserFromToken();
  }, []); // El array vacío [] significa que se ejecuta solo 1 vez

  // 4. Función de Login
  const login = async (email, password) => {
    // Llamo a mi API de backend
    const { data } = await api.post('/auth/login', { email, password });
    
    // Guardamos el token en localStorage para persistir la sesión
    localStorage.setItem('token', data.token);
    // Guardamos los datos del usuario en el estado global
    setUser(data.user);
    // (El SocketContext detectará este cambio en 'user' y se conectará)
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
    // (El SocketContext detectará 'user' como nulo y se desconectará)
  };

  // 7. Exponemos los valores y funciones a toda la app
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 8. Hook personalizado para usar el contexto fácilmente
// En lugar de importar useContext(AuthContext) en cada archivo,
// solo importo useAuth()
export const useAuth = () => {
  return useContext(AuthContext);
};