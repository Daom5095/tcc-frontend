/*
 * Página de Chat Privado (PrivateChatPage.js)
 * --- ¡MODIFICADO CON "IS TYPING" (FASE 2 - PASO 2)! ---
 * --- ¡MODIFICADO PARA USAR AppHeader REUTILIZABLE (BUG FIX)! ---
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// --- ¡INICIO DE CAMBIO! ---
import AppHeader from '../components/AppHeader'; // Importamos la cabecera correcta
import { Layout, Button, Space, Typography, Card, List, Avatar, Input, Empty, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';

// Ya no importamos 'Header' de Layout
const { Content } = Layout;
const { Title, Text } = Typography;
// --- ¡FIN DE CAMBIO! ---
const { Search } = Input;

function PrivateChatPage() {
  const { conversationId } = useParams();
  const { socket } = useSocket();
  // --- ¡CAMBIO! Ya no necesitamos 'logout' aquí ---
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationInfo, setConversationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [typingMessage, setTypingMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const typingUsers = useRef(new Map()).current;

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Función para obtener el nombre del "otro" usuario en el chat
  const getOtherParticipant = (convo) => {
    if (!convo || !user) return { name: 'Chat' };
    // Usamos la corrección de 'user.id' y 'user._id' que hicimos antes
    return convo.participants.find(p => p._id !== (user.id || user._id)) || { name: 'Chat Privado' };
  };

  // (El resto de los hooks useEffect y los handlers no cambian...)
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


  useEffect(() => {
    if (!socket || !conversationId || conversationId === 'general') return;

    console.log(`Socket uniéndose a la sala: ${conversationId}`);
    socket.emit('join_room', conversationId);

    const handleMessageReceived = (savedMessage) => {
      if (savedMessage.conversationId === conversationId) {
        typingUsers.delete(savedMessage.senderName);
        updateTypingMessage();
        
        setMessages((prevMessages) => [...prevMessages, savedMessage]);
      }
    };
    
    socket.on('chat:receive_private', handleMessageReceived);

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

    return () => {
      console.log(`Socket saliendo de la sala: ${conversationId}`);
      socket.off('chat:receive_private', handleMessageReceived);
      socket.off('chat:user_typing_private', handleUserTyping);
      socket.off('chat:user_stopped_typing_private', handleUserStoppedTyping);
    };
  }, [socket, conversationId, user.name, typingUsers, updateTypingMessage]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    if (!typingTimeoutRef.current && value.trim() !== '') {
      socket.emit('chat:start_typing_private', { roomId: conversationId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop_typing_private', { roomId: conversationId });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSend = (value) => {
    const content = value.trim();
    if (!content || !socket) return; 

    setIsSending(true);
    socket.emit('chat:send_private', {
      roomId: conversationId,
      content: content,
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = null;
    socket.emit('chat:stop_typing_private', { roomId: conversationId });

    setNewMessage('');
    setIsSending(false);
  };
  
  const otherUser = getOtherParticipant(conversationInfo);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      {/* --- ¡INICIO DE CAMBIO! --- */}
      {/* Usamos el componente AppHeader reutilizable */}
      <AppHeader title={`Chat con ${otherUser.name}`} backLink="/" />
      {/* --- ¡FIN DE CAMBIO! --- */}
      
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
          <div ref={messagesEndRef} />
        </Card>
        
        <div className="typing-indicator-container">
          {typingMessage && (
            <Text type="secondary" className="typing-indicator">
              {typingMessage}
            </Text>
          )}
        </div>

        {/* Formulario de envío (pegado al fondo) */}
        <div className="chat-input-container">
          <Search
            placeholder="Escribe un mensaje..."
            enterButton={<Button type="primary" icon={<SendOutlined />} />}
            size="large"
            value={newMessage}
            onChange={handleInputChange}
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