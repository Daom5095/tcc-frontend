/*
 * Página de Chat General (ChatGeneralPage.js)
 * --- ¡MODIFICADO CON "IS TYPING" (FASE 2 - PASO 2)! ---
 * --- ¡MODIFICADO PARA USAR AppHeader REUTILIZABLE (BUG FIX)! ---
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
// --- ¡INICIO DE CAMBIO! ---
import AppHeader from '../components/AppHeader'; // Importamos la cabecera correcta
import { Layout, Button, Space, Typography, Card, List, Avatar, Input, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';

// Ya no importamos 'Header' de Layout
const { Content } = Layout;
const { Title, Text } = Typography;
// --- ¡FIN DE CAMBIO! ---
const { Search } = Input; // Componente de Input con botón integrado

function ChatGeneralPage() {
  const { socket } = useSocket();
  // --- ¡CAMBIO! Ya no necesitamos 'logout' aquí ---
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(''); 
  const [isSending, setIsSending] = useState(false); 
  
  const [typingMessage, setTypingMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const typingUsers = useRef(new Map()).current; 

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // (El resto de los hooks useEffect y los handlers no cambian...)
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

    const handleUserTyping = ({ name }) => {
      if (name === user.name) return;
      typingUsers.set(name, name);
      updateTypingMessage();
    };
    
    const handleUserStoppedTyping = ({ name }) => {
      typingUsers.delete(name);
      updateTypingMessage();
    };

    socket.on('chat:user_typing_general', handleUserTyping);
    socket.on('chat:user_stopped_typing_general', handleUserStoppedTyping);

    return () => {
      socket.off('chat:general_history', handleHistory);
      socket.off('chat:receive_general', handleNewMessage);
      socket.off('chat:user_typing_general', handleUserTyping); 
      socket.off('chat:user_stopped_typing_general', handleUserStoppedTyping);
    };
  }, [socket, user.name, typingUsers, updateTypingMessage]); 

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    if (!typingTimeoutRef.current && value.trim() !== '') {
      socket.emit('chat:start_typing_general');
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop_typing_general');
      typingTimeoutRef.current = null;
    }, 2000);
  };
  
  const handleSend = (value) => {
    const content = value.trim();
    if (!content || !socket) return; 
    
    setIsSending(true);
    socket.emit('chat:send_general', {
      content: content,
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = null;
    socket.emit('chat:stop_typing_general');

    setNewMessage('');
    setIsSending(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      {/* --- ¡INICIO DE CAMBIO! --- */}
      {/* Usamos el componente AppHeader reutilizable */}
      <AppHeader title="Chat General" backLink="/" />
      {/* --- ¡FIN DE CAMBIO! --- */}
      
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
            autoComplete="off"
          />
        </div>
      </Content>
    </Layout>
  );
}

export default ChatGeneralPage;