/*
 * Página de Chat General (ChatGeneralPage.js)
 * --- ¡MODIFICADO CON "IS TYPING" (FASE 2 - PASO 2)! ---
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [newMessage, setNewMessage] = useState(''); 
  const [isSending, setIsSending] = useState(false); 
  
  // --- NUEVO: Estados y Refs para "Escribiendo..." ---
  const [typingMessage, setTypingMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const typingUsers = useRef(new Map()).current; // Mapa para manejar múltiples usuarios
  // --- Fin de nuevos estados ---

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Efecto para configurar los listeners del socket
  useEffect(() => {
    if (!socket) return; 

    console.log('ChatGeneralPage: Pidiendo historial de chat general...');
    socket.emit('chat:get_general_history');

    const handleHistory = (recentMessages) => {
      console.log('ChatGeneralPage: Recibiendo historial');
      setMessages(recentMessages);
    };
    socket.on('chat:general_history', handleHistory);

    const handleNewMessage = (savedMessage) => {
      console.log('ChatGeneralPage: Recibiendo nuevo mensaje');
      // Cuando llega un mensaje, el usuario DEJA de escribir
      typingUsers.delete(savedMessage.senderName);
      updateTypingMessage();
      
      setMessages((prevMessages) => {
        if (prevMessages.find(msg => msg._id === savedMessage._id)) {
          return prevMessages;
        }
        return [...prevMessages, savedMessage];
      });
    };
    socket.on('chat:receive_general', handleNewMessage);

    // --- NUEVO: Listeners para "Escribiendo..." ---
    const handleUserTyping = ({ name }) => {
      if (name === user.name) return; // No mostrar mi propio "escribiendo"
      typingUsers.set(name, name);
      updateTypingMessage();
      
      // Reinicia el timeout para este usuario (no implementado aquí, pero es una mejora)
    };
    
    const handleUserStoppedTyping = ({ name }) => {
      typingUsers.delete(name);
      updateTypingMessage();
    };

    socket.on('chat:user_typing_general', handleUserTyping);
    socket.on('chat:user_stopped_typing_general', handleUserStoppedTyping);
    // --- Fin de nuevos listeners ---

    // 4. Función de limpieza
    return () => {
      socket.off('chat:general_history', handleHistory);
      socket.off('chat:receive_general', handleNewMessage);
      socket.off('chat:user_typing_general', handleUserTyping); // <-- NUEVO
      socket.off('chat:user_stopped_typing_general', handleUserStoppedTyping); // <-- NUEVO
    };
  }, [socket, user.name, typingUsers, updateTypingMessage]); // <-- Dependencias actualizadas

  // --- NUEVO: Función para manejar el evento "onChange" del input ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    // Si no he enviado un evento "start" Y estoy escribiendo algo
    if (!typingTimeoutRef.current && value.trim() !== '') {
      socket.emit('chat:start_typing_general');
    }

    // Limpio el timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Creo un nuevo timeout. Si el usuario no escribe en 2s, emito "stop".
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop_typing_general');
      typingTimeoutRef.current = null; // Reseteo el ref
    }, 2000);
  };
  
  // Función para manejar el envío del mensaje
  const handleSend = (value) => {
    const content = value.trim();
    if (!content || !socket) return; 
    
    setIsSending(true);
    socket.emit('chat:send_general', {
      content: content,
    });
    
    // --- NUEVO: Al enviar, dejo de escribir ---
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = null;
    socket.emit('chat:stop_typing_general');
    // --- Fin ---

    setNewMessage(''); // Limpio el input controlado
    setIsSending(false);
  };

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
            autoComplete="off"
          />
        </div>
      </Content>
    </Layout>
  );
}

export default ChatGeneralPage;