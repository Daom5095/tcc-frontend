/*
 * Página de Reportes (ReportsPage.js)
 * --- ¡MODIFICADO PARA USAR AppHeader REUTILIZABLE (BUG FIX)! ---
 * --- ¡CORREGIDAS IMPORTACIONES NO USADAS (BUG FIX)! ---
 */
import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom'; // <-- CAMBIO: Eliminado
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import AppHeader from '../components/AppHeader'; 
import { 
  Layout, Typography, Card, Tag, Spin, 
  Alert, Empty, Row, Col, List, Divider 
  // Button, Space, <-- CAMBIO: Eliminados
} from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

function ReportsPage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // (El resto del código no cambia...)
  useEffect(() => {
    async function fetchReport() {
      if (user?.role === 'revisor') {
        setError('Acceso denegado. Esta página es solo para supervisores y administradores.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data } = await api.get('/api/reports/summary');
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el reporte');
      }
      setLoading(false);
    }

    if (user) {
      fetchReport();
    }
  }, [user]);

  const getStatusCount = (status) => {
    if (!report) return 0;
    return report.statusCounts.find(s => s._id === status)?.count || 0;
  };
  
  const getTotalProcesses = () => {
    if (!report) return 0;
    return report.statusCounts.reduce((acc, item) => acc + item.count, 0);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      <AppHeader title="Reportes de Auditoría" backLink="/" />

      <Content className="app-content">
        <div className="reports-page-main">
          <div className="content-header">
             <Title level={2}><BarChartOutlined style={{marginRight: '12px'}} />Estado General de la Plataforma</Title>
          </div>
          
          {loading && (
            <div style={{textAlign: 'center', padding: '50px'}}>
              <Spin size="large" />
            </div>
          )}
          
          {error && <Alert message={error} type="error" showIcon />}
          
          {report && !loading && !error && (
            <>
              <Title level={4}>Estado de Auditorías</Title>
              <Row gutter={[16, 16]} className="stats-grid">
                <Col xs={24} sm={12} md={6}>
                  <Card className="stat-card">
                    <Title level={3}>{getTotalProcesses()}</Title>
                    <Text type="secondary">Procesos Totales</Text>
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card className="stat-card stat-card-ok">
                    <Title level={3}>{getStatusCount('aprobado')}</Title>
                    <Text type="secondary">Aprobados</Text>
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card className="stat-card stat-card-warn">
                    <Title level={3}>{getStatusCount('en_revision') + getStatusCount('pendiente')}</Title>
                    <Text type="secondary">Pendientes</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                   <Card className="stat-card stat-card-danger">
                    <Title level={3}>{getStatusCount('rechazado')}</Title>
                    <Text type="secondary">Rechazados</Text>
                  </Card>
                </Col>
              </Row>

              <Divider />

              <Row gutter={[24, 24]} className="reports-columns">
                <Col xs={24} md={12}>
                  <Card title="Incidencias por Severidad" className="report-card">
                    <List
                      dataSource={report.incidentSeverityCounts}
                      locale={{ emptyText: <Empty description="No hay incidencias reportadas." /> }}
                      renderItem={(item) => (
                        <List.Item className="report-list-item">
                          <Tag color={
                            item._id === 'critica' ? 'error' :
                            item._id === 'media' ? 'warning' : 'success'
                          }>
                            {item._id.toUpperCase()}
                          </Tag>
                          <Text strong>{item.count} Incidencia(s)</Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card title="Carga de Trabajo por Revisor" className="report-card">
                    <List
                      dataSource={report.byRevisor}
                      locale={{ emptyText: <Empty description="No hay procesos asignados." /> }}
                      renderItem={(item) => (
                        <List.Item className="report-list-item">
                          <Text>{item.revisorName}</Text>
                          <Text strong>{item.count} Proceso(s)</Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default ReportsPage;