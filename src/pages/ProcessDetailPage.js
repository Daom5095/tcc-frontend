/*
 * Página de Detalle de Proceso (ProcessDetailPage.js)
 * --- ¡MODIFICADO PARA QUITAR LÍMITE DE ARCHIVOS (MEJORA)! ---
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

import { 
  Layout, Button, Space, Typography, Card, Tag, List, Avatar, 
  Form, Input, Select, Alert, Row, Col, Divider, Empty, Spin,
  Upload
} from 'antd';
import { 
  CheckOutlined, CloseOutlined, SendOutlined, 
  PaperClipOutlined, FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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

function ProcessDetailPage() {
  const { id: processId } = useParams();
  const { user } = useAuth(); 
  const { socket } = useSocket(); 
  const [form] = Form.useForm(); 

  const [processData, setProcessData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // (Las funciones de fetch, useEffect y handlers permanecen igual)
  const fetchProcessDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/api/processes/${processId}`);
      setProcessData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el proceso');
    }
    setLoading(false);
  }, [processId]);

  const fetchIncidents = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/processes/${processId}/incidents`);
      setIncidents(data);
    } catch (err) {
      console.error("Error cargando incidencias", err);
    }
  }, [processId]);

  useEffect(() => {
    fetchProcessDetails();
    fetchIncidents();
  }, [fetchProcessDetails, fetchIncidents]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleProcessUpdate = (updatedProcess) => {
      if (updatedProcess._id === processId) {
        setProcessData(updatedProcess); 
      }
    };
    
    const handleIncidentCreated = (newIncident) => {
      if (newIncident.processId === processId) {
        setIncidents(prev => [newIncident, ...prev]);
        if (user?.role === 'revisor') {
            setProcessData(prev => ({ ...prev, status: 'en_revision' }));
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

  const handleIncidentSubmit = async (values) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('description', values.description);
    formData.append('severity', values.severity);

    if (values.evidenceText) {
      formData.append('evidenceText', values.evidenceText);
    }
    if (values.evidenceLink) {
      if (!values.evidenceLink.startsWith('http://') && !values.evidenceLink.startsWith('https://')) {
        form.setFields([{ name: 'evidenceLink', errors: ['El enlace debe ser una URL válida (ej. http://...)'] }]);
        setIsSubmitting(false);
        return;
      }
      formData.append('evidenceLink', values.evidenceLink);
    }

    if (values.evidenceFiles && values.evidenceFiles.length > 0) {
      values.evidenceFiles.forEach(file => {
        formData.append('evidenceFiles', file.originFileObj);
      });
    }

    try {
      await api.post(`/api/processes/${processId}/incidents`, formData);
      form.resetFields();
    } catch (err) {
      form.setFields([{ name: 'description', errors: [err.response?.data?.message || 'Error al reportar'] }]);
    }
    setIsSubmitting(false);
  };
  
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

  if (!processData) return <Empty description="Proceso no encontrado." style={{marginTop: '5rem'}} />;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      <AppHeader title="Detalle de Auditoría" backLink="/" />

      <Content className="app-content-detail">
        <Row gutter={[24, 24]}>
          
          <Col xs={24} lg={12}>
            <Card title="Detalles de la Auditoría" style={{boxShadow: 'var(--sombra)', borderRadius: 'var(--radio-borde)'}}>
              <Title level={3}>{processData.title}</Title>
              <p><strong>Estado:</strong> <StatusBadge status={processData.status} /></p>
              <p><strong>Asignado a:</strong> {processData.assignedTo.name} ({processData.assignedTo.email})</p>
              <p><strong>Creado por:</strong> {processData.createdBy.name} ({processData.createdBy.email})</p>
              <Divider />
              <Title level={5}>Descripción</Title>
              <Paragraph>{processData.description || 'No hay descripción.'}</Paragraph>
              
              {user?.role !== 'revisor' && processData.status !== 'aprobado' && processData.status !== 'rechazado' && (
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

          <Col xs={24} lg={12}>
            <Card title="Gestión de Incidencias" style={{boxShadow: 'var(--sombra)', borderRadius: 'var(--radio-borde)'}}>
              {user?.role === 'revisor' && processData.status !== 'aprobado' && processData.status !== 'rechazado' && (
                <>
                  <Title level={4}>Reportar Incidencia (Comentario)</Title>
                  <Form
                    form={form}
                    layout="vertical"
                    name="incident_form"
                    onFinish={handleIncidentSubmit}
                    initialValues={{ severity: 'media' }}
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

                    {/* --- ¡INICIO DE CAMBIO! --- */}
                    <Form.Item
                      name="evidenceFiles"
                      label="Adjuntar Archivos" // <-- Texto actualizado
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) {
                          return e;
                        }
                        return e && e.fileList;
                      }}
                    >
                      <Upload
                        multiple={true}
                        beforeUpload={() => false}
                        listType="picture"
                      >
                        <Button icon={<UploadOutlined />}>Adjuntar Archivo(s)</Button>
                      </Upload>
                    </Form.Item>
                    {/* --- ¡FIN DE CAMBIO! --- */}

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
                            
                            {ev.type === 'archivo' && (
                              <Tag icon={<PaperClipOutlined />} color="blue">
                                <a 
                                  href={`${API_URL}${ev.url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  {ev.content}
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