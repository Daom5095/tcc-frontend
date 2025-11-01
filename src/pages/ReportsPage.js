/*
 * Página de Reportes (ReportsPage.js)
 * --- ¡MODIFICADA CON EXPORTACIÓN A CSV (FASE 3 - PASO 8)! ---
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppHeader from '../components/AppHeader';
import { 
  Layout, Space, Typography, Card, Spin, 
  Alert, Empty, Row, Col, Divider, Button // <-- NUEVO: Importar Button
} from 'antd';
import { BarChartOutlined, DownloadOutlined } from '@ant-design/icons'; // <-- NUEVO: Importar DownloadOutlined
import { Pie, Column } from '@ant-design/charts';

// --- NUEVO: Importar la librería de CSV ---
import { CSVLink } from 'react-csv';

const { Content } = Layout;
const { Title, Text } = Typography;

// --- NUEVO: Definir las cabeceras para los archivos CSV ---
// Estas 'keys' deben coincidir con las que envía tu API de backend
const severityHeaders = [
  { label: "Severidad", key: "_id" },
  { label: "Cantidad", key: "count" }
];

const revisorHeaders = [
  { label: "Revisor", key: "revisorName" },
  { label: "Email", key: "revisorEmail" },
  { label: "Procesos Asignados", key: "count" }
];
// --- Fin de cabeceras ---


function ReportsPage() {
  const { user } = useAuth();
  
  const [report, setReport] = useState(null);
  const [severityData, setSeverityData] = useState([]);
  const [revisorData, setRevisorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        // Formatear datos para el gráfico de Severidad
        const sevData = data.incidentSeverityCounts.map(item => ({
          type: item._id.charAt(0).toUpperCase() + item._id.slice(1),
          value: item.count,
        }));
        setSeverityData(sevData);

        // Formatear datos para el gráfico de Carga de Trabajo
        const revData = data.byRevisor.map(item => ({
          name: item.revisorName,
          value: item.count,
        }));
        setRevisorData(revData);

      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el reporte');
      }
      setLoading(false);
    }

    if (user) {
      fetchReport();
    }
  }, [user]);

  // Funciones para procesar los datos (sin cambios)
  const getStatusCount = (status) => {
    return report?.statusCounts.find(s => s._id === status)?.count || 0;
  };
  
  const getTotalProcesses = () => {
    return report?.statusCounts.reduce((acc, item) => acc + item.count, 0) || 0;
  };

  // Configuraciones de gráficos (sin cambios)
  const severityConfig = {
    appendPadding: 10,
    data: severityData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    color: ({ type }) => {
      if (type === 'Critica') return '#f5222d';
      if (type === 'Media') return '#faad14';
      if (type === 'Baja') return '#52c41a';
      return '#d9d9d9';
    },
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: { 
        fontSize: 14, 
        textAlign: 'center',
        fill: '#fff'
      },
    },
    interactions: [{ type: 'element-active' }],
    legend: {
      position: 'bottom',
    },
  };

  const revisorConfig = {
    data: revisorData,
    xField: 'name',
    yField: 'value',
    xAxis: { label: { autoRotate: false } },
    yAxis: { title: { text: 'N° de Procesos Asignados' } },
    label: { position: 'top', style: { fill: '#555' } },
    interactions: [{ type: 'element-active' }],
  };

  // --- NUEVO: Función para generar nombre de archivo ---
  const getCsvFilename = (baseName) => {
    const date = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    return `${baseName}_${date}.csv`;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader title="Reportes de Auditoría" backLink="/" />

      <Content className="app-content">
        <div className="reports-page-main">
          {/* --- MODIFICADO: Añadidos botones de exportación --- */}
          <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Title level={2} style={{ margin: 0 }}>
               <BarChartOutlined style={{marginRight: '12px'}} />
               Estado General de la Plataforma
             </Title>
             
             {/* --- INICIO DE CÓDIGO NUEVO --- */}
             <Space>
                <CSVLink
                  data={report?.incidentSeverityCounts || []}
                  headers={severityHeaders}
                  filename={getCsvFilename('reporte_severidad')}
                >
                  <Button icon={<DownloadOutlined />} disabled={!report || loading}>
                    Exportar Severidad
                  </Button>
                </CSVLink>
                <CSVLink
                  data={report?.byRevisor || []}
                  headers={revisorHeaders}
                  filename={getCsvFilename('reporte_carga_revisores')}
                >
                  <Button icon={<DownloadOutlined />} disabled={!report || loading}>
                    Exportar Carga
                  </Button>
                </CSVLink>
             </Space>
             {/* --- FIN DE CÓDIGO NUEVO --- */}
          </div>
          
          {loading && (
            <div style={{textAlign: 'center', padding: '50px'}}>
              <Spin size="large" />
            </div>
          )}
          
          {error && <Alert message={error} type="error" showIcon />}
          
          {report && !loading && !error && (
            <>
              {/* --- 1. Tarjetas de Estado (Sin cambios) --- */}
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

              {/* --- 2. Reporte de Incidencias (Sin cambios) --- */}
              <Row gutter={[24, 24]} className="reports-columns">
                <Col xs={24} md={12}>
                  <Card title="Incidencias por Severidad" className="report-card">
                    {severityData.length > 0 ? (
                      <Pie {...severityConfig} height={300} />
                    ) : (
                      <Empty description="No hay incidencias reportadas." />
                    )}
                  </Card>
                </Col>

                {/* --- 3. Reporte por Revisor (Sin cambios) --- */}
                <Col xs={24} md={12}>
                  <Card title="Carga de Trabajo por Revisor" className="report-card">
                    {revisorData.length > 0 ? (
                      <Column {...revisorConfig} height={300} />
                    ) : (
                       <Empty description="No hay procesos asignados." />
                    )}
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