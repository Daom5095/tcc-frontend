/*
 * Página de Chat General (ChatGeneralPage.js)
 *
 * Esta es la página dedicada al chat público "general".
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

function ChatGeneralPage() {
  const { socket } = useSocket(); // Obtengo el socket de mi contexto
  const { user, logout } = useAuth(); // Obtengo mis datos de usuario
  
  const [messages, setMessages] = useState([]); // Lista de mensajes
  const [newMessage, setNewMessage] = useState(''); // El mensaje que estoy escribiendo
  
  const messagesEndRef = useRef(null);

  // Efecto para hacer scroll-down automático cuando llegan mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Efecto para configurar los listeners del socket
  useEffect(() => {
    if (!socket) return; 

    // 1. Apenas me monto, le pido el historial al backend
    console.log('ChatGeneralPage: Pidiendo historial de chat general...');
    socket.emit('chat:get_general_history'); // <-- Evento de pedir historial

    // 2. Escucho el historial de mensajes
    const handleHistory = (recentMessages) => {
      console.log('ChatGeneralPage: Recibiendo historial');
      setMessages(recentMessages);
    };
    socket.on('chat:general_history', handleHistory); // <-- Escucho el historial

    // 3. Escucho cuando un nuevo mensaje es guardado (de cualquier usuario)
    const handleNewMessage = (savedMessage) => {
      console.log('ChatGeneralPage: Recibiendo nuevo mensaje');
      // Añado el mensaje
      setMessages((prevMessages) => {
        // Evito duplicados
        if (prevMessages.find(msg => msg._id === savedMessage._id)) {
          return prevMessages;
        }
        return [...prevMessages, savedMessage];
      });
    };
    socket.on('chat:receive_general', handleNewMessage); // <-- Escucho nuevos mensajes

    // 4. Función de limpieza
    return () => {
      socket.off('chat:general_history', handleHistory);
      socket.off('chat:receive_general', handleNewMessage);
    };
  }, [socket]); // Solo dependo de 'socket'

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return; 

    // Emito mi nuevo mensaje al backend con el nuevo nombre
    socket.emit('chat:send_general', { // <-- Evento de enviar
      content: newMessage,
    });
    
    setNewMessage('');
  };

  return (
    <div className="chat-page-container">
      <header className="dashboard-header">
        <h1>
          <Link to="/" className="back-button">
            &larr;
          </Link>
          <span className="header-title-static">Chat General</span>
        </h1>
        <nav>
          {/* --- ¡AÑADIDO! El enlace a Reportes --- */}
          {user?.role !== 'revisor' && (
            <Link to="/reports" className="header-nav-link">Reportes</Link>
          )}
          <span className="header-nav-user">
            Bienvenido, {user?.name} ({user?.role})
          </span>
          <button onClick={logout}>Cerrar Sesión</button>
        </nav>
      </header>

      <main className="chat-page-main">
        <div className="chat-container full-page">
          {/* --- 1. LISTA DE MENSAJES --- */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-placeholder">Inicia la conversación...</p>
            )}
            
            {messages.map((msg) => (
              <div 
                key={msg.id || msg._id} 
                className={`message-item ${msg.senderId === user.id ? 'own' : ''}`}
              >
                {msg.senderId !== user.id && (
                  <div className="message-sender">{msg.senderName}</div>
                )}
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* --- 2. FORMULARIO DE ENVÍO --- */}
          <form onSubmit={handleSubmit} className="chat-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              autoComplete="off"
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ChatGeneralPage;