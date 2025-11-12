/*
 * Página de Chat General (ChatGeneralPage.js)
 * --- ¡MODIFICADO PARA USAR AppHeader REUTILIZABLE (BUG FIX)! ---
 * --- ¡CORREGIDAS IMPORTACIONES NO USADAS (BUG FIX)! ---
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Link } from 'react-router-dom'; // <-- CAMBIO: Ya no se usa aquí
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// --- ¡INICIO DE CAMBIO! ---
import AppHeader from '../components/AppHeader'; 
import { Layout, Button, Typography, Card, List, Avatar, Input, Empty } from 'antd'; // <-- 'Space' eliminado
import { SendOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Text } = Typography; // <-- 'Title' eliminado
// --- ¡FIN DE CAMBIO! ---
const { Search } = Input;

function ChatGeneralPage() {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(''); 
  const [isSending, setIsSending] = useState(false); 
  
  const [typingMessage, setTypingMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const typingUsers = useRef(new Map()).current; 

  const messagesEndRef = useRef(null);

  // (El resto del código no cambia...)
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
      
      <AppHeader title="Chat General" backLink="/" />
      
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