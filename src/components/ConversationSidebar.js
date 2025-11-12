/*
 * Componente ConversationSidebar.js
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN! ---
 *
 * 1. Muestra la lista de conversaciones (públicas y privadas).
 * 2. Muestra un <Modal> de AntD para iniciar un nuevo chat privado.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import api from '../services/api';
// Importamos componentes de AntD
import { Modal, Button, List, Avatar, Spin, Typography } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

function ConversationSidebar() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]); // Lista de todos los usuarios
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  // Ya no necesitamos dialogRef

  // Cargar las conversaciones y la lista de usuarios
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [convRes, userRes] = await Promise.all([
          api.get('/api/conversations'),
          api.get('/api/users')
        ]);
        
        setConversations(convRes.data);
        // Filtramos para no mostrarme a mí mismo en la lista de "nuevo chat"
        setUsers(userRes.data.filter(u => u._id !== user.id));
        
      } catch (err) {
        console.error("Error cargando datos de conversación", err);
      }
      setLoading(false);
    }
    
    if (user) {
      loadData();
    }
  }, [user]);

  // Función para iniciar un nuevo chat (o ir a uno existente)
  const handleStartChat = async (receiverId) => {
    try {
      const { data } = await api.post('/api/conversations', { receiverId });
      setShowModal(false); // Cierro el modal
      navigate(`/chat/${data._id}`); // Navego a la página de ese chat
    } catch (err) {
      console.error("Error al iniciar chat", err);
    }
  };

  // Función para obtener el nombre del "otro" participante
  const getOtherParticipantName = (convo) => {
  const otherUser = convo.participants.find(p => p._id !== (user.id || user._id));
    return otherUser ? otherUser.name : 'Usuario';
  };

  return (
    <div className="conversation-sidebar">
      <div className="conversation-header">
        <h3>Conversaciones</h3>
        {/* Botón de AntD en lugar del <button>+</div> */}
        <Button 
          type="primary" 
          shape="circle"
          icon={<PlusOutlined />} 
          title="Nuevo Chat"
          onClick={() => setShowModal(true)} 
        />
      </div>

      {loading && <Text type="secondary">Cargando...</Text>}
      
      <div className="conversation-list">
        {/* Esta lista mantiene los estilos de index.css que ya tenías */}
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

      {/* --- Modal de AntD para Nuevo Chat --- */}
      <Modal
        title="Iniciar un nuevo chat"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null} // No necesitamos botones de OK/Cancelar
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spin />
          </div>
        ) : (
          <List
            className="contact-list-antd" // Puedes usar esto para estilos si lo necesitas
            itemLayout="horizontal"
            dataSource={users}
            locale={{ emptyText: 'No se e ncontraron otros usuarios.' }}
            renderItem={(contact) => (
              <List.Item 
                className="contact-item-antd"
                hoverable // Agrega efecto hover
                onClick={() => handleStartChat(contact._id)}
                style={{ cursor: 'pointer', padding: '12px 8px' }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ backgroundColor: '#007bff' }} 
                      icon={<UserOutlined />} 
                    />
                  }
                  title={<Text strong>{contact.name} ({contact.role})</Text>}
                  description={contact.email}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
}

export default ConversationSidebar;