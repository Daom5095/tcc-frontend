/*
 * Página de Chat General (ChatGeneralPage.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN! ---
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
// Importamos los nuevos componentes de AntD
import { Layout, Button, Space, Typography, Card, List, Avatar, Input, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input; // Componente de Input con botón integrado

function ChatGeneralPage() {
  const { socket } = useSocket();
  const { user, logout } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(''); // Estado para el input controlado
  const [isSending, setIsSending] = useState(false); // Para el estado de carga
  
  const messagesEndRef = useRef(null);

  // Efecto para hacer scroll-down automático cuando llegan mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Efecto para configurar los listeners del socket
  useEffect(() => {
    if (!socket) return; 

    // 1. Pido el historial al backend
    console.log('ChatGeneralPage: Pidiendo historial de chat general...');
    socket.emit('chat:get_general_history');

    // 2. Escucho el historial de mensajes
    const handleHistory = (recentMessages) => {
      console.log('ChatGeneralPage: Recibiendo historial');
      setMessages(recentMessages);
    };
    socket.on('chat:general_history', handleHistory);

    // 3. Escucho cuando un nuevo mensaje es guardado
    const handleNewMessage = (savedMessage) => {
      console.log('ChatGeneralPage: Recibiendo nuevo mensaje');
      setMessages((prevMessages) => {
        if (prevMessages.find(msg => msg._id === savedMessage._id)) {
          return prevMessages;
        }
        return [...prevMessages, savedMessage];
      });
    };
    socket.on('chat:receive_general', handleNewMessage);

    // 4. Función de limpieza
    return () => {
      socket.off('chat:general_history', handleHistory);
      socket.off('chat:receive_general', handleNewMessage);
    };
  }, [socket]);

  // Función para manejar el envío del mensaje
  const handleSend = (value) => {
    const content = value.trim();
    if (!content || !socket) return; 
    
    setIsSending(true);
    socket.emit('chat:send_general', {
      content: content,
    });
    
    setNewMessage(''); // Limpio el input controlado
    setIsSending(false);
  };

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
          <Text style={{color: '#aaa', paddingLeft: '10px'}}>| Chat General</Text>
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
          <List
            className="chat-messages-list"
            itemLayout="horizontal"
            dataSource={messages}
            locale={{ emptyText: <Empty description="Inicia la conversación..." /> }}
            renderItem={(msg) => (
              // Usamos la clase 'own' para alinear mis propios mensajes
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
            onSearch={handleSend} // onSearch se activa con Enter o clic en el botón
            loading={isSending}
            autoComplete="off"
          />
        </div>
      </Content>
    </Layout>
  );
}

export default ChatGeneralPage;