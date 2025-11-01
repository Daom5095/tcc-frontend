/*
 * Página del Dashboard (DashboardPage.js)
 * --- ¡MODIFICADO PARA NOTIFICACIONES PERSISTENTES (FASE 2 - PASO 1)! ---
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <-- NUEVO: Importar useNavigate
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ProcessModal from '../components/ProcessModal';
import ConversationSidebar from '../components/ConversationSidebar'; 

// --- MODIFICADO: Añadimos Badge y Empty ---
import { 
  Layout, Button, Space, Typography, Card, Tag, List, Avatar, 
  Alert, Input, Select, Row, Col, Spin, Pagination, Badge, Empty // <-- Añadido Badge y Empty
} from 'antd';
import { PlusOutlined, BellOutlined, CheckCircleOutlined } from '@ant-design/icons'; // <-- Añadido CheckCircleOutlined

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 9;

// Componente de StatusBadge (sin cambios)
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
  // --- MODIFICADO: Obtenemos las notificaciones y la nueva función del context ---
  const { socket, notifications, markAllAsRead } = useSocket();
  const navigate = useNavigate(); // <-- NUEVO: Para navegar al hacer clic en notif

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProcesses, setTotalProcesses] = useState(0);

  // --- NUEVO: Contar notificaciones no leídas ---
  const unreadCount = notifications.filter(notif => !notif.read).length;

  // fetchProcesses (sin cambios desde el paso anterior)
  const fetchProcesses = useCallback(async (page) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/processes', {
        params: {
          search: searchTerm,
          status: statusFilter,
          page: page,
          limit: PAGE_SIZE
        }
      });
      setProcesses(data.processes);
      setTotalProcesses(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar procesos');
    }
    setLoading(false);
  }, [searchTerm, statusFilter]);

  // useEffect para cargar procesos (sin cambios)
  useEffect(() => {
    fetchProcesses(currentPage);
  }, [fetchProcesses, currentPage]);

  // useEffect de Sockets (Lógica de refresco de procesos)
  // --- MODIFICADO: Ya no maneja notificaciones aquí ---
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
      // Esta lógica sigue siendo para refrescar la lista de procesos
      if (currentPage === 1 && statusFilter === 'todos' && searchTerm === '') {
        if (user?.role !== 'revisor' && newProcess.createdBy._id === user?.id) {
           setProcesses(prev => [newProcess, ...prev.slice(0, PAGE_SIZE - 1)]);
           setTotalProcesses(prev => prev + 1);
        } else if (user?.role === 'revisor' && newProcess.assignedTo._id === user?.id) {
           setProcesses(prev => [newProcess, ...prev.slice(0, PAGE_SIZE - 1)]);
           setTotalProcesses(prev => prev + 1);
        }
      } else {
        setTotalProcesses(prev => prev + 1);
      }
    };
    
    const handleIncidentCreated = (data) => {
       if (user?.role !== 'revisor') {
         setProcesses(prev => prev.map(p => 
           p._id === data.processId ? { ...p, status: 'en_revision' } : p
         ));
       }
    };

    // Solo escuchamos eventos que afectan a la lista de procesos
    socket.on('process:status_updated', handleProcessUpdate);
    socket.on('process:assigned', handleNewProcess); // Este es el evento de 'proceso'
    socket.on('incident:created', handleIncidentCreated);

    return () => {
      socket.off('process:status_updated', handleProcessUpdate);
      socket.off('process:assigned', handleNewProcess);
      socket.off('incident:created', handleIncidentCreated);
    };

  }, [socket, user?.id, user?.role, currentPage, statusFilter, searchTerm]);

  // (Funciones de handlers sin cambios)
  const handleProcessCreated = (newProcess) => {
    if (currentPage === 1 && statusFilter === 'todos' && searchTerm === '') {
      setProcesses(prev => [newProcess, ...prev.slice(0, PAGE_SIZE - 1)]);
    }
    setTotalProcesses(prev => prev + 1);
    setShowModal(false);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // --- NUEVO: Handler para clic en notificación ---
  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
    // (Idealmente, aquí llamaríamos a una API para marcar esta *única* notif como leída)
    // Por ahora, solo el "marcar todas" funciona
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
          {/* --- NUEVO: Badge de notificaciones en el header --- */}
          <Badge count={unreadCount} size="small" style={{marginRight: '1rem'}}>
             {/* Este ícono podría ir a una página /notificaciones en el futuro */}
            <BellOutlined style={{ color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} />
          </Badge>

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

            {/* SECCIÓN DE FILTROS (sin cambios) */}
            <Card style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Input.Search
                    placeholder="Buscar por título..."
                    onSearch={handleSearch}
                    onChange={(e) => {
                      if (e.target.value === '') handleSearch('');
                    }}
                    enterButton
                    size="large"
                    loading={loading}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Select
                    defaultValue="todos"
                    style={{ width: '100%' }}
                    onChange={handleStatusChange}
                    size="large"
                    value={statusFilter}
                  >
                    <Option value="todos">Todos los Estados</Option>
                    <Option value="pendiente">Pendiente</Option>
                    <Option value="en_revision">En Revisión</Option>
                    <Option value="aprobado">Aprobado</Option>
                    <Option value="rechazado">Rechazado</Option>
                  </Select>
                </Col>
              </Row>
            </Card>
            
            {error && <Alert message={error} type="error" showIcon />}
            
            {/* LISTA DE PROCESOS (sin cambios) */}
            {loading ? (
              <div style={{textAlign: 'center', padding: '50px'}}>
                <Spin size="large" />
              </div>
            ) : (
              <div> 
                <div className="process-list-grid">
                  {processes.length === 0 && (
                    <Typography.Text type="secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '1.1rem' }}>
                      No se encontraron procesos que coincidan con tus filtros.
                    </Typography.Text>
                  )}
                  {processes.map((process) => (
                    <Link to={`/process/${process._id}`} key={process._id} className="link-style-reset">
                      <Card 
                        hoverable 
                        extra={<StatusBadge status={process.status} />}
                      >
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

                {/* PAGINACIÓN (sin cambios) */}
                {totalProcesses > PAGE_SIZE && (
                  <Pagination
                    current={currentPage}
                    total={totalProcesses}
                    pageSize={PAGE_SIZE}
                    onChange={handlePageChange}
                    style={{ textAlign: 'center', marginTop: '24px' }}
                    showSizeChanger={false}
                  />
                )}
              </div>
            )}
          </div>
        </Content>

        {/* --- SIDER DE AntD (MODIFICADO) --- */}
        <Sider className="app-sider" width={350}>
          <div className="sider-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <Title level={4} style={{ margin: 0 }}>
                <Badge count={unreadCount}>
                  <BellOutlined style={{marginRight: '8px'}} />
                </Badge>
                Notificaciones
              </Title>
              {/* --- NUEVO: Botón para marcar como leídas --- */}
              {unreadCount > 0 && (
                <Button 
                  type="link" 
                  size="small" 
                  icon={<CheckCircleOutlined />}
                  onClick={markAllAsRead}
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>
            <List
              itemLayout="horizontal"
              dataSource={notifications} // <-- Ahora viene del context con historial
              locale={{ emptyText: <Empty description="No hay notificaciones." /> }}
              renderItem={(notif) => (
                // --- MODIFICADO: Añade clase si está leída y onClick ---
                <List.Item 
                  className={notif.read ? "notification-item notification-item-read" : "notification-item"}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ cursor: notif.link ? 'pointer' : 'default' }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<BellOutlined />} 
                        style={{
                          backgroundColor: notif.read ? '#f0f0f0' : '#e6f7ff', 
                          color: notif.read ? '#aaa' : '#007bff'
                        }} 
                      />
                    }
                    title={<Text strong={!notif.read}>{notif.message}</Text>}
                    description={
                      <Text type="secondary">
                        {new Date(notif.createdAt).toLocaleString()}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
          
          <ConversationSidebar />
        </Sider>
      </Layout>

      {/* --- MODAL DE AntD (sin cambios) --- */}
      <ProcessModal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        onProcessCreated={handleProcessCreated}
      />
    </Layout>
  );
}

export default DashboardPage;