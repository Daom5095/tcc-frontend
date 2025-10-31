/*
 * Componente ConversationSidebar.js
 *
 * Este componente vive en la barra lateral del Dashboard.
 * 1. Muestra la lista de conversaciones (públicas y privadas).
 * 2. Muestra un modal para iniciar un nuevo chat privado con cualquier usuario.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// --- ¡ESTA ES LA RUTA CORREGIDA! ---
import { useAuth } from '../context/AuthContext'; 
import api from '../services/api';

function ConversationSidebar() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]); // Lista de todos los usuarios
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  // Cargar las conversaciones y la lista de usuarios
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Pido mis conversaciones
        const convRes = await api.get('/api/conversations');
        setConversations(convRes.data);
        
        // Pido todos los usuarios para el modal de "nuevo chat"
        const userRes = await api.get('/api/users');
        setUsers(userRes.data);
      } catch (err) {
        console.error("Error cargando datos de conversación", err);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Controlar el modal
  useEffect(() => {
    if (showModal) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showModal]);

  // Función para iniciar un nuevo chat (o ir a uno existente)
  const handleStartChat = async (receiverId) => {
    try {
      // Llamo a la API para crear/obtener la conversación
      const { data } = await api.post('/api/conversations', { receiverId });
      setShowModal(false); // Cierro el modal
      // Navego a la página de ese chat
      navigate(`/chat/${data._id}`);
    } catch (err) {
      console.error("Error al iniciar chat", err);
    }
  };

  // Función para obtener el nombre del "otro" participante en un chat privado
  const getOtherParticipantName = (convo) => {
    const otherUser = convo.participants.find(p => p._id !== user.id);
    return otherUser ? otherUser.name : 'Usuario';
  };

  return (
    <div className="conversation-sidebar">
      <div className="conversation-header">
        <h3>Conversaciones</h3>
        <button onClick={() => setShowModal(true)} className="new-chat-button" title="Nuevo Chat">+</button>
      </div>

      {loading && <p>Cargando...</p>}
      
      <div className="conversation-list">
        {conversations.map(convo => (
          <Link 
            key={convo._id} 
            to={convo.type === 'public' ? '/chat/general' : `/chat/${convo._id}`} 
            className="conversation-item"
          >
            {convo.type === 'public' ? 'Chat General' : getOtherParticipantName(convo)}
          </Link>
        ))}
      </div>

      {/* Modal para Nuevo Chat */}
      <dialog ref={dialogRef} onClose={() => setShowModal(false)} className="modal">
        <div className="modal-header">
          <h3>Iniciar un nuevo chat</h3>
          <button onClick={() => setShowModal(false)}>&times;</button>
        </div>
        <div className="contact-list">
          {users.length === 0 && <p>No se encontraron otros usuarios.</p>}
          {users.map(contact => (
            <div 
              key={contact._id} 
              className="contact-item" 
              onClick={() => handleStartChat(contact._id)}
            >
              <strong>{contact.name}</strong> ({contact.role})
              <small>{contact.email}</small>
            </div>
          ))}
        </div>
      </dialog>
    </div>
  );
}

export default ConversationSidebar;