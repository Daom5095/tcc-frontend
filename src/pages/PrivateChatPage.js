/*
 * Página de Chat Privado (PrivateChatPage.js)
 * --- ¡MODIFICADO CON "IS TYPING" (FASE 2 - PASO 2)! ---
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// Importamos los nuevos componentes de AntD
import { Layout, Button, Space, Typography, Card, List, Avatar, Input, Empty, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

function PrivateChatPage() {
  const { conversationId } = useParams();
  const { socket } = useSocket();
  const { user, logout } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationInfo, setConversationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- NUEVO: Estados y Refs para "Escribiendo..." ---
  const [typingMessage, setTypingMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const typingUsers = useRef(new Map()).current;
  // --- Fin de nuevos estados ---

  const messagesEndRef = useRef(null);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Función para obtener el nombre del "otro" usuario en el chat
  const getOtherParticipant = (convo) => {
    if (!convo || !user) return { name: 'Chat' };
   // Aplicamos la misma corrección aquí
  return convo.participants.find(p => p._id !== (user.id || user._id)) || { name: 'Chat Privado' };
  };

  // 1. Cargar el historial de mensajes
  const loadChatHistory = useCallback(async () => {
    if (!conversationId || conversationId === 'general') {
      setLoading(false);
      return; 
    }
    try {
      setLoading(true);
      const { data } = await api.get(`/api/conversations/${conversationId}/messages`);
      setMessages(data);
      
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

  // --- NUEVO: Función para actualizar el mensaje de "escribiendo" ---
  const updateTypingMessage = useCallback(() => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) {
      setTypingMessage('');
    } else if (names.length === 1) {
      setTypingMessage(`${names[0]} está escribiendo...`);
    } else {
      setTypingMessage(`${names.join(', ')} están escribiendo...`);
    }
  }, [typingUsers]);


  // 2. Efecto para conectarse a la sala de Socket
  useEffect(() => {
    if (!socket || !conversationId || conversationId === 'general') return;

    console.log(`Socket uniéndose a la sala: ${conversationId}`);
    socket.emit('join_room', conversationId);

    const handleMessageReceived = (savedMessage) => {
      if (savedMessage.conversationId === conversationId) {
        // Cuando llega un mensaje, el usuario DEJA de escribir
        typingUsers.delete(savedMessage.senderName);
        updateTypingMessage();
        
        setMessages((prevMessages) => [...prevMessages, savedMessage]);
      }
    };
    
    socket.on('chat:receive_private', handleMessageReceived);

    // --- NUEVO: Listeners para "Escribiendo..." ---
    const handleUserTyping = ({ name }) => {
      if (name === user.name) return;
      typingUsers.set(name, name);
      updateTypingMessage();
    };
    
    const handleUserStoppedTyping = ({ name }) => {
      typingUsers.delete(name);
      updateTypingMessage();
    };

    socket.on('chat:user_typing_private', handleUserTyping);
    socket.on('chat:user_stopped_typing_private', handleUserStoppedTyping);
    // --- Fin de nuevos listeners ---

    return () => {
      console.log(`Socket saliendo de la sala: ${conversationId}`);
      socket.off('chat:receive_private', handleMessageReceived);
      socket.off('chat:user_typing_private', handleUserTyping); // <-- NUEVO
      socket.off('chat:user_stopped_typing_private', handleUserStoppedTyping); // <-- NUEVO
    };
  }, [socket, conversationId, user.name, typingUsers, updateTypingMessage]); // <-- Dependencias actualizadas

  // --- NUEVO: Función para manejar el evento "onChange" del input ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    // Si no he enviado un evento "start" Y estoy escribiendo algo
    if (!typingTimeoutRef.current && value.trim() !== '') {
      socket.emit('chat:start_typing_private', { roomId: conversationId });
    }

    // Limpio el timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Creo un nuevo timeout. Si el usuario no escribe en 2s, emito "stop".
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop_typing_private', { roomId: conversationId });
      typingTimeoutRef.current = null; // Reseteo el ref
    }, 2000);
  };

  // Función para enviar un mensaje
  const handleSend = (value) => {
    const content = value.trim();
    if (!content || !socket) return; 

    setIsSending(true);
    socket.emit('chat:send_private', {
      roomId: conversationId,
      content: content,
    });
    
    // --- NUEVO: Al enviar, dejo de escribir ---
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = null;
    socket.emit('chat:stop_typing_private', { roomId: conversationId });
    // --- Fin ---

    setNewMessage(''); // Limpio el input
    setIsSending(false);
  };
  
  const otherUser = getOtherParticipant(conversationInfo);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Encabezado de AntD (sin cambios) */}
      <Header className="app-header">
        <Space>
          <Link to="/" className="back-button-ant">
            &larr;
          </Link>
          <div className="app-header-logo">
             <Title level={3} style={{ color: 'white', margin: 0 }}>Aegis</Title>
          </div>
          <Text style={{color: '#aaa', paddingLeft: '10px'}}>| Chat con {otherUser.name}</Text>
        </Space>
        <Space>
          {user?.role !== 'revisor' && (
            <Link to="/reports">
              <Button type="text" style={{ color: '#fff' }}>Reportes</Button>
            </Link>
          )}
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Bienvenido, {user?.name} ({user?.role})
          </Text>
          <Button type="primary" danger onClick={logout}>
            Cerrar Sesión
          </Button>
        </Space>
      </Header>
      
      {/* Contenido principal con el chat */}
      <Content className="app-content-chat">
        <Card className="chat-card-container">
          {loading ? (
            <div style={{textAlign: 'center', padding: '50px'}}>
              <Spin size="large" />
            </div>
          ) : (
            <List
              className="chat-messages-list"
              itemLayout="horizontal"
              dataSource={messages}
              locale={{ emptyText: <Empty description="Aún no hay mensajes." /> }}
              renderItem={(msg) => (
                <List.Item key={msg.id || msg._id} className={msg.senderId === user.id ? 'message-item own' : 'message-item'}>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: msg.senderId === user.id ? '#007bff' : '#f56a00' }}>
                        {msg.senderName.substring(0, 1).toUpperCase()}
                      </Avatar>
                    }
                    title={msg.senderId === user.id ? "Tú" : msg.senderName}
                    description={msg.content}
                  />
                </List.Item>
              )}
            />
          )}
          {/* Div para forzar el scroll al final */}
          <div ref={messagesEndRef} />
        </Card>
        
        {/* --- NUEVO: Indicador de "Escribiendo..." --- */}
        <div className="typing-indicator-container">
          {typingMessage && (
            <Text type="secondary" className="typing-indicator">
              {typingMessage}
            </Text>
          )}
        </div>
        {/* --- Fin de "Escribiendo..." --- */}

        {/* Formulario de envío (pegado al fondo) */}
        <div className="chat-input-container">
          <Search
            placeholder="Escribe un mensaje..."
            enterButton={<Button type="primary" icon={<SendOutlined />} />}
            size="large"
            value={newMessage}
            onChange={handleInputChange} // <-- MODIFICADO
            onSearch={handleSend}
            loading={isSending}
            disabled={loading}
            autoComplete="off"
          />
        </div>
      </Content>
    </Layout>
  );
}

export default PrivateChatPage;