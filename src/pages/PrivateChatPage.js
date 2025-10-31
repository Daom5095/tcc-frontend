/*
 * Página de Chat Privado (PrivateChatPage.js)
 *
 * Esta página maneja una conversación 1-a-1.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function PrivateChatPage() {
  const { conversationId } = useParams(); // ID de la conversación desde la URL
  const { socket } = useSocket();
  const { user, logout } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationInfo, setConversationInfo] = useState(null); // Para saber con quién hablo
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Función para obtener el nombre del "otro" usuario en el chat
  const getOtherParticipant = (convo) => {
    if (!convo || !user) return { name: 'Chat' };
    return convo.participants.find(p => p._id !== user.id) || { name: 'Chat Privado' };
  };

  // 1. Cargar el historial de mensajes al cargar la página
  const loadChatHistory = useCallback(async () => {
    if (!conversationId || conversationId === 'general') {
      setLoading(false);
      return; 
    }
    try {
      setLoading(true);
      // Pido a la API el historial de este chat
      const { data } = await api.get(`/api/conversations/${conversationId}/messages`);
      setMessages(data);
      
      // Pido la info de la conversación para saber el nombre
      const convoRes = await api.get(`/api/conversations`);
      const currentConvo = convoRes.data.find(c => c._id === conversationId);
      setConversationInfo(currentConvo);

    } catch (err) {
      console.error("Error cargando historial", err);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);


  // 2. Efecto para conectarse a la sala de Socket
  useEffect(() => {
    if (!socket || !conversationId || conversationId === 'general') return;

    // 1. Me uno a la sala específica de este chat
    console.log(`Socket uniéndose a la sala: ${conversationId}`);
    socket.emit('join_room', conversationId);

    // 2. Escucho por mensajes privados
    const handleMessageReceived = (savedMessage) => {
      // Solo añado el mensaje si pertenece a esta conversación
      if (savedMessage.conversationId === conversationId) {
        setMessages((prevMessages) => [...prevMessages, savedMessage]);
      }
    };
    
    socket.on('chat:receive_private', handleMessageReceived); // <-- Escucho el evento privado

    // 3. Limpieza: Dejo de escuchar
    return () => {
      console.log(`Socket saliendo de la sala: ${conversationId}`);
      socket.off('chat:receive_private', handleMessageReceived); // <-- Limpio el evento privado
    };
  }, [socket, conversationId]);

  // Función para enviar un mensaje
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return; 

    // Emito un 'chat:send_private'
    socket.emit('chat:send_private', { // <-- Evento de enviar privado
      roomId: conversationId,
      content: newMessage,
    });
    
    setNewMessage('');
  };
  
  const otherUser = getOtherParticipant(conversationInfo);

  return (
    <div className="chat-page-container">
      <header className="dashboard-header">
        <h1>
          <Link to="/" className="back-button">
            &larr;
          </Link>
          <span className="header-title-static">Chat con {otherUser.name}</span>
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
          <div className="chat-messages">
            {loading && <p className="chat-placeholder">Cargando mensajes...</p>}
            {!loading && messages.length === 0 && (
              <p className="chat-placeholder">Aún no hay mensajes.</p>
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

export default PrivateChatPage;