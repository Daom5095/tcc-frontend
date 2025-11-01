/*
 * Página de Detalle de Proceso (ProcessDetailPage.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN! ---
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

// --- ¡Nuevas importaciones de AntD! ---
import { 
  Layout, Button, Space, Typography, Card, Tag, List, Avatar, 
  Form, Input, Select, Alert, Row, Col, Divider, Empty, Spin
} from 'antd';
import { 
  CheckOutlined, CloseOutlined, SendOutlined, 
  PaperClipOutlined, FileTextOutlined 
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Componente para el badge de estado
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

function ProcessDetailPage() {
  const { id: processId } = useParams(); // Obtengo el ID del proceso desde la URL
  const { user, logout } = useAuth(); // Obtengo mi rol, info Y la función logout
  const { socket } = useSocket(); // Obtengo el socket para escuchar
  const [form] = Form.useForm(); // Hook de AntD para el formulario de incidencia

  const [process, setProcess] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Función para cargar el detalle del proceso ---
  const fetchProcessDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/api/processes/${processId}`);
      setProcess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el proceso');
    }
    setLoading(false);
  }, [processId]);

  // --- Función para cargar las incidencias ---
  const fetchIncidents = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/processes/${processId}/incidents`);
      setIncidents(data);
    } catch (err) {
      console.error("Error cargando incidencias", err);
    }
  }, [processId]);

  // --- Carga de datos inicial ---
  useEffect(() => {
    fetchProcessDetails();
    fetchIncidents();
  }, [fetchProcessDetails, fetchIncidents]);
  
  // --- Escuchar Sockets para updates en ESTA página ---
  useEffect(() => {
    if (!socket) return;
    
    // Si el estado del proceso cambia (ej. Supervisor aprueba)
    const handleProcessUpdate = (updatedProcess) => {
      if (updatedProcess._id === processId) {
        setProcess(updatedProcess); // Actualizo el estado en mi página
      }
    };
    
    // Si se crea una nueva incidencia
    const handleIncidentCreated = (newIncident) => {
      if (newIncident.processId === processId) {
        // La añado a la lista de incidencias en tiempo real
        setIncidents(prev => [newIncident, ...prev]);
        // Si soy revisor, también actualizo el estado del proceso
        if (user?.role === 'revisor') {
            setProcess(prev => ({ ...prev, status: 'en_revision' }));
        }
      }
    };
    
    socket.on('process:status_updated', handleProcessUpdate);
    socket.on('incident:created', handleIncidentCreated);

    return () => {
      socket.off('process:status_updated', handleProcessUpdate);
      socket.off('incident:created', handleIncidentCreated);
    };

  }, [socket, processId, user?.role]);

  // --- Manejador para enviar el formulario de Incidencia ---
  const handleIncidentSubmit = async (values) => {
    setIsSubmitting(true);
    
    // Construimos el array de evidencia
    const evidencePayload = [];
    if (values.evidenceText) {
      evidencePayload.push({ type: 'texto', content: values.evidenceText });
    }
    if (values.evidenceLink) {
      // Validación simple
      if (!values.evidenceLink.startsWith('http://') && !values.evidenceLink.startsWith('https://')) {
        form.setFields([{ name: 'evidenceLink', errors: ['El enlace debe ser una URL válida (ej. http://...)'] }]);
        setIsSubmitting(false);
        return;
      }
      evidencePayload.push({ type: 'enlace', content: values.evidenceLink });
    }
    
    try {
      // Llamo a la API del backend para crear la incidencia
      await api.post(`/api/processes/${processId}/incidents`, {
        description: values.description,
        severity: values.severity,
        evidence: evidencePayload,
      });
      
      form.resetFields(); // Limpio el formulario de AntD
      
    } catch (err) {
      form.setFields([{ name: 'description', errors: [err.response?.data?.message || 'Error al reportar'] }]);
    }
    setIsSubmitting(false);
  };
  
  // --- Manejador para Aprobar/Rechazar (Supervisor) ---
  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`¿Estás seguro de que quieres ${newStatus} este proceso?`)) {
      return;
    }
    try {
      await api.put(`/api/processes/${processId}/status`, { status: newStatus });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar estado');
    }
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (error) {
    return <Alert message={error} type="error" showIcon style={{margin: '2rem'}} />;
  }

  if (!process) return <Empty description="Proceso no encontrado." style={{marginTop: '5rem'}} />;

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
          <Text style={{color: '#aaa', paddingLeft: '10px'}}>| Detalle de Auditoría</Text>
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

      {/* Contenido de la página de detalle */}
      <Content className="app-content-detail">
        <Row gutter={[24, 24]}>
          
          {/* --- Columna Izquierda: Detalles y Acciones --- */}
          <Col xs={24} lg={12}>
            <Card title="Detalles de la Auditoría" style={{boxShadow: 'var(--sombra)', borderRadius: 'var(--radio-borde)'}}>
              <Title level={3}>{process.title}</Title>
              <p><strong>Estado:</strong> <StatusBadge status={process.status} /></p>
              <p><strong>Asignado a:</strong> {process.assignedTo.name} ({process.assignedTo.email})</p>
              <p><strong>Creado por:</strong> {process.createdBy.name} ({process.createdBy.email})</p>
              <Divider />
              <Title level={5}>Descripción</Title>
              <Paragraph>{process.description || 'No hay descripción.'}</Paragraph>
              
              {/* --- ZONA DEL SUPERVISOR --- */}
              {user?.role !== 'revisor' && process.status !== 'aprobado' && process.status !== 'rechazado' && (
                <div className="supervisor-actions-antd">
                  <Divider />
                  <Title level={4}>Acciones de Supervisor</Title>
                  <Text type="secondary">Revisar las incidencias y tomar una decisión.</Text>
                  <Space style={{marginTop: '1rem'}}>
                    <Button 
                      type="primary"
                      className="button-success" 
                      icon={<CheckOutlined />} 
                      size="large"
                      onClick={() => handleStatusUpdate('aprobado')}
                    >
                      Aprobar Proceso
                    </Button>
                    <Button 
                      type="primary" 
                      danger 
                      icon={<CloseOutlined />} 
                      size="large"
                      onClick={() => handleStatusUpdate('rechazado')}
                    >
                      Rechazar Proceso
                    </Button>
                  </Space>
                </div>
              )}
            </Card>
          </Col>

          {/* --- Columna Derecha: Incidencias --- */}
          <Col xs={24} lg={12}>
            <Card title="Gestión de Incidencias" style={{boxShadow: 'var(--sombra)', borderRadius: 'var(--radio-borde)'}}>
              {/* --- ZONA DEL REVISOR --- */}
              {user?.role === 'revisor' && process.status !== 'aprobado' && process.status !== 'rechazado' && (
                <>
                  <Title level={4}>Reportar Incidencia (Comentario)</Title>
                  <Form
                    form={form}
                    layout="vertical"
                    name="incident_form"
                    onFinish={handleIncidentSubmit}
                    initialValues={{ severity: 'media' }} // Valor por defecto
                  >
                    <Form.Item
                      name="severity"
                      label="Severidad"
                      rules={[{ required: true, message: 'Por favor selecciona la severidad' }]}
                    >
                      <Select>
                        <Option value="baja">Baja</Option>
                        <Option value="media">Media</Option>
                        <Option value="critica">Crítica</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="Descripción"
                      rules={[
                        { required: true, message: 'La descripción es obligatoria' },
                        { min: 10, message: 'Debe tener al menos 10 caracteres' }
                      ]}
                    >
                      <Input.TextArea rows={4} placeholder="Describe el hallazgo o comentario..." />
                    </Form.Item>
                    <Form.Item
                      name="evidenceText"
                      label="Evidencia (Texto Opcional)"
                    >
                      <Input.TextArea rows={2} placeholder="Añade notas de texto..." />
                    </Form.Item>
                    <Form.Item
                      name="evidenceLink"
                      label="Enlace de Evidencia (Opcional)"
                      rules={[{ type: 'url', message: 'Debe ser una URL válida (ej. http://...)' }]}
                    >
                      <Input prefix={<PaperClipOutlined />} placeholder="https://ejemplo.com/imagen.png" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={isSubmitting} icon={<SendOutlined />}>
                        {isSubmitting ? 'Enviando...' : 'Enviar Incidencia'}
                      </Button>
                    </Form.Item>
                  </Form>
                  <Divider />
                </>
              )}

              {/* --- LISTA DE INCIDENCIAS --- */}
              <Title level={4} style={{marginTop: 0}}>Historial de Incidencias</Title>
              <List
                className="incident-list-antd"
                itemLayout="horizontal"
                dataSource={incidents}
                locale={{ emptyText: <Empty description="No se han reportado incidencias." /> }}
                renderItem={(incident) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          className={`severity-badge-avatar severity-${incident.severity}`}
                        >
                          {incident.severity.substring(0, 1).toUpperCase()}
                        </Avatar>
                      }
                      title={<Text strong>{incident.description}</Text>}
                      description={
                        <>
                          <Text>Reportado por: {incident.reportedBy.name}</Text>
                          <br />
                          <Text type="secondary">{new Date(incident.createdAt).toLocaleString()}</Text>
                        </>
                      }
                    />
                    {/* Mostramos la evidencia */}
                    {incident.evidence && incident.evidence.length > 0 && (
                      <div className="evidence-list">
                        {incident.evidence.map((ev, index) => (
                          <div key={index} className="evidence-list-item">
                            {ev.type === 'texto' && (
                              <Tag icon={<FileTextOutlined />}>Evidencia de Texto</Tag>
                            )}
                            {ev.type === 'enlace' && (
                              <Tag icon={<PaperClipOutlined />}>
                                <a href={ev.content} target="_blank" rel="noopener noreferrer">
                                  Ver Enlace
                                </a>
                              </Tag>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default ProcessDetailPage;