/*
 * Página del Dashboard (DashboardPage.js)
 * --- ¡MODIFICADO CON SCROLL INDEPENDIENTE (BUG FIX)! ---
 * --- ¡MODIFICADO CON DELETE (BUG FIX)! ---
 * --- ¡CORREGIDAS IMPORTACIONES NO USADAS (BUG FIX)! ---
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ProcessModal from '../components/ProcessModal';
import ConversationSidebar from '../components/ConversationSidebar'; 
import AppHeader from '../components/AppHeader'; 

import { 
  Layout, Button, Typography, Card, Tag, List, Avatar, 
  Alert, Input, Select, Row, Col, Spin, Pagination, Badge, Empty
  // --- ¡INICIO DE CAMBIO! ---
  // 'Space' eliminado
  // --- ¡FIN DE CAMBIO! ---
} from 'antd';
import { 
  PlusOutlined, BellOutlined, CheckCircleOutlined, CloseOutlined
} from '@ant-design/icons';

const { Content, Sider } = Layout; 
const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 9;

// (El componente StatusBadge no cambia)
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
  const { user } = useAuth();
  const { socket, notifications, markAllAsRead, deleteNotification } = useSocket();
  const navigate = useNavigate(); 

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProcesses, setTotalProcesses] = useState(0);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // (El resto del código no cambia...)
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

  useEffect(() => {
    fetchProcesses(currentPage);
  }, [fetchProcesses, currentPage]);

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
      if (currentPage === 1 && statusFilter === 'todos' && searchTerm === '') {
         setProcesses(prev => [newProcess, ...prev.slice(0, PAGE_SIZE - 1)]);
         setTotalProcesses(prev => prev + 1);
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

    socket.on('process:status_updated', handleProcessUpdate);
    socket.on('process:assigned', handleNewProcess); 
    socket.on('incident:created', handleIncidentCreated);

    return () => {
      socket.off('process:status_updated', handleProcessUpdate);
      socket.off('process:assigned', handleNewProcess);
      socket.off('incident:created', handleIncidentCreated);
    };

  }, [socket, user?.role, currentPage, statusFilter, searchTerm]);

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
  
  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };


  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      <AppHeader />
      
      <Layout>
        <Content className="app-content">
          <div className="dashboard-processes">
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

        <Sider 
          className="app-sider" 
          width={350}
          breakpoint="lg" 
          collapsedWidth="0"
        >
          <div className="sider-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <Title level={4} style={{ margin: 0 }}>
                <Badge count={unreadCount}>
                  <BellOutlined style={{marginRight: '8px'}} />
                </Badge>
                Notificaciones
              </Title>
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
            
            <div className="notification-list-wrapper">
              <List
                itemLayout="horizontal"
                dataSource={notifications} 
                locale={{ emptyText: <Empty description="No hay notificaciones." /> }}
                renderItem={(notif) => (
                  <List.Item 
                    className={notif.read ? "notification-item notification-item-read" : "notification-item"}
                    onClick={() => handleNotificationClick(notif)}
                    style={{ cursor: notif.link ? 'pointer' : 'default' }}
                    extra={
                      <Button
                        className="notification-delete-btn"
                        type="text"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => handleDeleteNotification(e, notif._id)}
                      />
                    }
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
            
          </div>
          
          <ConversationSidebar />
        </Sider>
      </Layout>

      <ProcessModal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        onProcessCreated={handleProcessCreated}
      />
    </Layout>
  );
}

export default DashboardPage;