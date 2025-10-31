/*
 * Contexto de Sockets (SocketContext.js)
 *
 * Este proveedor maneja la conexión de Socket.io.
 * Depende de AuthContext, ya que SOLO debe conectarse si el
 * usuario está autenticado.
 *
 * También actúa como el "centro de notificaciones" de la app,
 * escuchando eventos del backend y almacenándolos en un estado.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Importamos el contexto de Auth

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]); // Estado para notificaciones
  
  const { user } = useAuth(); // Obtenemos el usuario logueado desde AuthContext

  useEffect(() => {
    // Solo nos conectamos si el usuario está logueado
    if (user) {
      const token = localStorage.getItem('token');
      
      const newSocket = io('http://localhost:4000', { 
        auth: {
          token: token
        }
      });

      setSocket(newSocket);
      console.log('SocketContext: Conectando...');

      // --- LISTENERS DE NOTIFICACIONES ---
      newSocket.on('process:assigned', (notification) => {
        console.log('¡Nuevo proceso asignado!', notification);
        setNotifications(prev => [notification, ...prev]);
      });
      newSocket.on('incident:created', (notification) => {
        console.log('¡Nueva incidencia reportada!', notification);
        setNotifications(prev => [notification, ...prev]);
      });
      newSocket.on('process:status_updated', (notification) => {
        console.log('¡Estado de proceso actualizado!', notification);
        setNotifications(prev => [notification, ...prev]);
      });

      // Función de limpieza: Se ejecuta cuando el 'user' cambia (ej. logout)
      return () => {
        console.log('SocketContext: Desconectando...');
        
        // Limpiamos los listeners de notificación
        newSocket.off('process:assigned');
        newSocket.off('incident:created');
        newSocket.off('process:status_updated');
        
        newSocket.disconnect();
      };
    }
  }, [user]); // Este efecto se ejecuta cada vez que 'user' cambia (login/logout)

  // Exponemos solo el socket y las notificaciones
  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
    </SocketContext.Provider>
  );
};