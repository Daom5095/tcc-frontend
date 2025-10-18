import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; 

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]); // Estado para notificaciones
  const { user } = useAuth(); // Obtenemos el usuario logueado

  useEffect(() => {
    // Solo nos conectamos si el usuario está logueado
    if (user) {
      const token = localStorage.getItem('token');
      
      // 1. Nos conectamos al backend, enviando el token para la autenticación del socket
      const newSocket = io('http://localhost:4000', { 
        auth: {
          token: token
        }
      });

      setSocket(newSocket);

      // --- AQUÍ ESCUCHAMOS LOS EVENTOS DEL BACKEND ---

      // Escuchamos cuando nos asignan un nuevo proceso
      newSocket.on('process:assigned', (notification) => {
        console.log('¡Nuevo proceso asignado!', notification);
        setNotifications(prev => [notification, ...prev]);
        //disparar una alerta/sonido
      });

      // Escuchamos cuando un revisor crea una incidencia
      newSocket.on('incident:created', (notification) => {
        console.log('¡Nueva incidencia reportada!', notification);
        setNotifications(prev => [notification, ...prev]);
      });

      // Escuchamos cuando un proceso es aprobado/rechazado
      newSocket.on('process:status_updated', (notification) => {
        console.log('¡Estado de proceso actualizado!', notification);
        setNotifications(prev => [notification, ...prev]);
      });

      // --- FIN  ---

      // Desconectamos el socket cuando el componente se desmonta o el usuario cambia
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]); // Este efecto se ejecuta cada vez que 'user' cambia

  // Exponemos el socket y las notificaciones
  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
    </SocketContext.Provider>
  );
};