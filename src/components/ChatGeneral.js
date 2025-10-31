/*
 * Componente ChatGeneral.js
 *
 * Este componente ahora es "tonto". Solo muestra los mensajes
 * que recibe del SocketContext y le dice al backend cuándo se
 * envía un nuevo mensaje.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

function ChatGeneral() {
  // --- ¡MEJORA! ---
  // Obtenemos el estado de los mensajes DESDE EL CONTEXTO.
  // Este estado 'messages' persistirá aunque naveguemos a otra página.
  const { socket, messages } = useSocket(); 
  const { user } = useAuth(); // Obtengo mis datos de usuario
  
  const [newMessage, setNewMessage] = useState(''); // Estado local solo para el input
  
  const messagesEndRef = useRef(null);

  // Efecto para hacer scroll-down (sin cambios)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- ¡ELIMINADO! ---
  // El useEffect que escuchaba 'recent_messages' y 'message_saved'
  // se eliminó de aquí. ¡SocketContext se encarga de eso!
  
  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return; // No envío mensajes vacíos

    // Solo emitimos el evento.
    // El listener en SocketContext se encargará de recibir
    // este mismo mensaje de vuelta y actualizar el estado 'messages'.
    socket.emit('new_message', {
      content: newMessage,
    });
    
    // Limpio mi input
    setNewMessage('');
  };

  return (
    <div className="chat-container">
      {/* --- 1. LISTA DE MENSAJES --- */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-placeholder">Inicia la conversación...</p>
        )}
        
        {messages.map((msg) => (
          // Verifico si el mensaje es mío para alinearlo a la derecha
          <div 
            key={msg.id || msg._id} // Usamos id o _id (de la BD)
            className={`message-item ${msg.senderId === user.id ? 'own' : ''}`}
          >
            {/* Solo muestro el nombre si NO es mi propio mensaje */}
            {msg.senderId !== user.id && (
              <div className="message-sender">{msg.senderName}</div>
            )}
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {/* Elemento vacío para el auto-scroll */}
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
  );
}

export default ChatGeneral;