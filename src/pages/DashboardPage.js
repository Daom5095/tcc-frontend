/*
 * Página del Dashboard (DashboardPage.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN LAYOUT! ---
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ProcessModal from '../components/ProcessModal';
import ConversationSidebar from '../components/ConversationSidebar'; 

// --- ¡CORRECCIÓN! Añado 'Alert' y quito 'Badge' ---
import { Layout, Button, Space, Typography, Card, Tag, List, Avatar, Alert } from 'antd';
// --- ¡CORRECCIÓN! Quito 'UserOutlined' ---
import { PlusOutlined, BellOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// Muevo el StatusBadge aquí para mantener el componente limpio
const StatusBadge = ({ status }) => {
  let color;
  switch (status) {
    case 'pendiente':
      color = 'warning';
      break;
    case 'en_revision':
      color = 'processing';
      break;
    case 'aprobado':
      color = 'success';
      break;
    case 'rechazado':
      color = 'error';
      break;
    default:
      color = 'default';
  }
  return <Tag color={color}>{status.replace('_', ' ').toUpperCase()}</Tag>;
};

function DashboardPage() {
  const { user, logout } = useAuth();
  const { socket, notifications } = useSocket();

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Función para actualizar la lista de procesos
  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/processes');
      setProcesses(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar procesos');
    }
    setLoading(false);
  }, []);

  // 1. Cargar procesos al inicio
  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  // 2. Escuchar sockets para actualizaciones en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleProcessUpdate = (updatedProcess) => {
      setProcesses(prevProcesses => 
        prevProcesses.map(p => 
          p._id === updatedProcess._id ? updatedProcess : p
        )
      );
    };

    const handleNewProcess = (newProcess) => {
      if (user?.role !== 'revisor' && newProcess.createdBy._id === user?.id) {
         setProcesses(prev => [newProcess, ...prev]);
      } else if (user?.role === 'revisor' && newProcess.assignedTo._id === user?.id) {
         setProcesses(prev => [newProcess, ...prev]);
      }
    };
    
    const handleIncidentCreated = (data) => {
       if (user?.role !== 'revisor') {
         setProcesses(prev => prev.map(p => 
           p._id === data.processId ? { ...p, status: 'en_revision' } : p
         ));
       }
    };

    socket.on('process:status_updated', handleProcessUpdate);
    socket.on('process:assigned', handleNewProcess);
    socket.on('incident:created', handleIncidentCreated);

    return () => {
      socket.off('process:status_updated', handleProcessUpdate);
      socket.off('process:assigned', handleNewProcess);
      socket.off('incident:created', handleIncidentCreated);
    };

  }, [socket, user?.id, user?.role]);

  // Cuando el modal AntD tiene éxito, actualizamos
  const handleProcessCreated = (newProcess) => {
    setProcesses(prev => [newProcess, ...prev]);
    setShowModal(false); // Cierro el modal
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* --- HEADER DE AntD --- */}
      <Header className="app-header">
        <div className="app-header-logo">
          <Title level={3} style={{ color: 'white', margin: 0 }}>Aegis</Title>
        </div>
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
      
      {/* --- LAYOUT CON SIDER --- */}
      <Layout>
        <Content className="app-content">
          <div className="dashboard-processes">
            {/* Título y botón de crear */}
            <div className="content-header">
              <Title level={2}>Panel de Procesos</Title>
              {user?.role !== 'revisor' && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  size="large"
                  onClick={() => setShowModal(true)}
                >
                  Crear Nueva Auditoría
                </Button>
              )}
            </div>
            
            {user?.role === 'revisor' && (
              <Title level={3} style={{color: 'var(--color-texto-secundario)', fontWeight: 400}}>Mis Auditorías Asignadas</Title>
            )}

            {loading && <p>Cargando procesos...</p>}
            
            {/* --- ¡CORREGIDO! Ahora <Alert> está definido --- */}
            {error && <Alert message={error} type="error" showIcon />}
            
            {/* --- LISTA DE PROCESOS CON AntD Card --- */}
            <div className="process-list-grid">
              {processes.length === 0 && !loading && !error && (
                <Text>No hay procesos para mostrar.</Text>
              )}
              {processes.map((process) => (
                <Link to={`/process/${process._id}`} key={process._id} className="link-style-reset">
                  <Card hoverable className="process-card">
                    <StatusBadge status={process.status} />
                    <Title level={4} style={{marginTop: '10px'}}>{process.title}</Title>
                    {user?.role !== 'revisor' ? (
                      <Text type="secondary">Asignado a: {process.assignedTo?.name || 'N/A'}</Text>
                    ) : (
                      <Text type="secondary">Creado por: {process.createdBy?.name || 'N/A'}</Text>
                    )}
                    <br/>
                    <Text type="secondary" style={{fontSize: '0.8em'}}>
                      Creado: {new Date(process.createdAt).toLocaleString()}
                    </Text>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </Content>

        {/* --- SIDER DE AntD --- */}
        <Sider className="app-sider" width={350}>
          <div className="sider-section">
            <Title level={4}><BellOutlined style={{marginRight: '8px'}} /> Notificaciones</Title>
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              locale={{ emptyText: 'No hay notificaciones nuevas.' }}
              renderItem={(notif, index) => (
                <List.Item className="notification-item">
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} style={{backgroundColor: '#e6f7ff', color: '#007bff'}} />}
                    title={<Text strong>{notif.message}</Text>}
                    description={notif.severity ? `Severidad: ${notif.severity}` : null}
                  />
                </List.Item>
              )}
            />
          </div>
          
          <ConversationSidebar />
        </Sider>
      </Layout>

      {/* --- MODAL DE AntD --- */}
      <ProcessModal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        onProcessCreated={handleProcessCreated}
      />
    </Layout>
  );
}

export default DashboardPage;