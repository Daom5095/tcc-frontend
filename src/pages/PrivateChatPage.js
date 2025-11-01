/*
 * Página de Chat Privado (PrivateChatPage.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN! ---
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


  // 2. Efecto para conectarse a la sala de Socket
  useEffect(() => {
    if (!socket || !conversationId || conversationId === 'general') return;

    console.log(`Socket uniéndose a la sala: ${conversationId}`);
    socket.emit('join_room', conversationId);

    const handleMessageReceived = (savedMessage) => {
      if (savedMessage.conversationId === conversationId) {
        setMessages((prevMessages) => [...prevMessages, savedMessage]);
      }
    };
    
    socket.on('chat:receive_private', handleMessageReceived);

    return () => {
      console.log(`Socket saliendo de la sala: ${conversationId}`);
      socket.off('chat:receive_private', handleMessageReceived);
    };
  }, [socket, conversationId]);

  // Función para enviar un mensaje
  const handleSend = (value) => {
    const content = value.trim();
    if (!content || !socket) return; 

    setIsSending(true);
    socket.emit('chat:send_private', {
      roomId: conversationId,
      content: content,
    });
    
    setNewMessage(''); // Limpio el input
    setIsSending(false);
  };
  
  const otherUser = getOtherParticipant(conversationInfo);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Encabezado de AntD */}
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
        
        {/* Formulario de envío (pegado al fondo) */}
        <div className="chat-input-container">
          <Search
            placeholder="Escribe un mensaje..."
            enterButton={<Button type="primary" icon={<SendOutlined />} />}
            size="large"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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