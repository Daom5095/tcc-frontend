/*
 * Componente Reutilizable de Cabecera (AppHeader.js)
 * --- ¡MODIFICADO CON ENLACE A PANEL DE ADMIN (FASE 3 - PASO 9)! ---
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, Button, Space, Typography, Dropdown, Menu, Avatar, Badge } from 'antd';
// --- NUEVO: Importar ícono de Admin ---
import { UserOutlined, BellOutlined, LogoutOutlined, ProfileOutlined, SettingOutlined } from '@ant-design/icons';
import { useSocket } from '../context/SocketContext'; 

const { Header } = Layout;
const { Title, Text } = Typography;

function AppHeader({ title, backLink }) {
  const { user, logout } = useAuth();
  const { notifications } = useSocket(); 

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // --- MODIFICADO: Añadimos items al menú dinámicamente ---
  const menuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: (
        <Link to="/profile">
          Mi Perfil
        </Link>
      ),
    },
  ];

  // --- NUEVO: Añadir enlace de Admin solo si el rol es 'admin' ---
  if (user?.role === 'admin') {
    menuItems.push({
      key: 'admin',
      icon: <SettingOutlined />,
      label: (
        <Link to="/admin/users">
          Panel de Admin
        </Link>
      ),
    });
  }
  // --- Fin ---

  // Añadir separador y logout
  menuItems.push({
    type: 'divider',
  });
  menuItems.push({
    key: 'logout',
    icon: <LogoutOutlined />,
    danger: true,
    label: 'Cerrar Sesión',
    onClick: logout,
  });

  return (
    <Header className="app-header">
      <Space>
        {backLink && (
          <Link to={backLink} className="back-button-ant">
            &larr;
          </Link>
        )}
        <div className="app-header-logo">
           <Title level={3} style={{ color: 'white', margin: 0 }}>Aegis</Title>
        </div>
        {title && (
          <Text style={{color: '#aaa', paddingLeft: '10px'}}>| {title}</Text>
        )}
      </Space>
      
      <Space size="middle">
        {user?.role !== 'revisor' && (
          <Link to="/reports">
            <Button type="text" style={{ color: '#fff' }}>Reportes</Button>
          </Link>
        )}
        
        <Badge count={unreadCount} size="small">
          <BellOutlined style={{ color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} />
        </Badge>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" style={{ backgroundColor: '#007bff' }} icon={<UserOutlined />} />
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              Hola, {user?.name}
            </Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}

export default AppHeader;