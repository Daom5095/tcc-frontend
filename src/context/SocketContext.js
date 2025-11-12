/*
 * Contexto de Sockets (SocketContext.js)
 * --- ¡MODIFICADO PARA NOTIFICACIONES PERSISTENTES (FASE 2 - PASO 1)! ---
 * --- ¡MODIFICADO CON DELETE (BUG FIX)! ---
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Importamos el contexto de Auth
import api from '../services/api'; // <-- NUEVO: Importamos API para fetching

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]); // Sigue siendo la fuente de verdad
  const { user } = useAuth(); // Obtenemos el usuario logueado desde AuthContext

  // --- NUEVO: Función para marcar todas como leídas ---
  const markAllAsRead = useCallback(async () => {
    try {
      // 1. Llama a la API del backend
      await api.put('/api/notifications/read-all');
      
      // 2. Actualiza el estado localmente para que la UI reaccione
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error("Error al marcar notificaciones como leídas:", err);
    }
  }, []); // Depende de 'api' (que es constante)

  // --- ¡INICIO DE CÓDIGO NUEVO! ---
  // Función para eliminar una sola notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      // 1. Llama a la nueva API del backend
      await api.delete(`/api/notifications/${notificationId}`);
      
      // 2. Actualiza el estado local (filtrando la eliminada)
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
    } catch (err) {
      console.error("Error al eliminar notificación:", err);
    }
  }, []);
  // --- ¡FIN DE CÓDIGO NUEVO! ---


  useEffect(() => {
    // Solo nos conectamos si el usuario está logueado
    if (user) {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      
      const newSocket = io(API_URL, {
        auth: {
          token: token
        }
      });

      setSocket(newSocket);
      console.log('SocketContext: Conectando...');

      // --- NUEVO: Cargar notificaciones históricas ---
      const fetchNotifications = async () => {
        try {
          const { data } = await api.get('/api/notifications');
          setNotifications(data); // Carga el historial desde la BD
        } catch (err) {
          console.error("Error cargando historial de notificaciones:", err);
        }
      };
      fetchNotifications();
      // --- Fin de carga histórica ---

      // --- LISTENERS DE NOTIFICACIONES (Ahora añaden a la lista) ---
      // Esta función genérica añade cualquier notificación nueva al inicio de la lista
      const handleNewNotification = (notification) => {
        console.log('¡Notificación recibida!', notification);
        setNotifications(prev => [notification, ...prev]);
      };

      // Escuchamos los eventos que definimos en el backend
      newSocket.on('process:assigned', handleNewNotification);
      newSocket.on('incident:created', handleNewNotification);
      newSocket.on('process:status_updated', handleNewNotification);
      newSocket.on('chat:new_message_notification', handleNewNotification); // Para chats

      // Función de limpieza
      return () => {
        console.log('SocketContext: Desconectando...');
        
        newSocket.off('process:assigned', handleNewNotification);
        newSocket.off('incident:created', handleNewNotification);
        newSocket.off('process:status_updated', handleNewNotification);
        newSocket.off('chat:new_message_notification', handleNewNotification);
        
        newSocket.disconnect();
      };
    } else {
      // Si el usuario hace logout, limpia el socket y las notificaciones
      setSocket(null);
      setNotifications([]);
    }
  }, [user]); // Este efecto se ejecuta cada vez que 'user' cambia (login/logout)

  // Exponemos el socket, las notificaciones Y la nueva función
  return (
    <SocketContext.Provider value={{ 
      socket, 
      notifications, 
      markAllAsRead, 
      deleteNotification // <-- ¡CAMBIO! Exponemos la nueva función
    }}>
      {children}
    </SocketContext.Provider>
  );
};