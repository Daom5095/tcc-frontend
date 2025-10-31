/*
 * Página de Reportes (ReportsPage.js)
 *
 * Esta página es exclusiva para Admins y Supervisores.
 * Muestra las estadísticas y el estado de avance de todos los procesos.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ReportsPage() {
  const { user, logout } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Al cargar la página, pido los datos a la API de reportes
  useEffect(() => {
    async function fetchReport() {
      // Si el usuario es 'revisor', lo saco de aquí.
      if (user?.role === 'revisor') {
        setError('Acceso denegado.');
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
  }, [user]); // Dependo de 'user' para saber si tengo permiso

  // Funciones para procesar los datos del reporte
  const getStatusCount = (status) => {
    return report?.statusCounts.find(s => s._id === status)?.count || 0;
  };

  if (loading) return <div>Cargando reportes...</div>;

  return (
    <div>
      <header className="dashboard-header">
        <h1>
          <Link to="/" className="back-button">
            &larr;
          </Link>
          <span className="header-title-static">Reportes de Auditoría</span>
        </h1>
        <nav>
          {/* El admin/supervisor también puede ver el link de Reportes */}
          {user?.role !== 'revisor' && (
            <Link to="/reports" className="header-nav-link">Reportes</Link>
          )}
          <span className="header-nav-user">
            Bienvenido, {user?.name} ({user?.role})
          </span>
          <button onClick={logout}>Cerrar Sesión</button>
        </nav>
      </header>

      <main className="reports-page-main">
        {error && <p className="auth-error">{error}</p>}
        {report && (
          <>
            {/* --- 1. Tarjetas de Estado de Procesos --- */}
            <h2>Estado General de Procesos</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{getStatusCount('pendiente')}</h3>
                <p>Pendientes</p>
              </div>
              <div className="stat-card">
                <h3>{getStatusCount('en_revision')}</h3>
                <p>En Revisión</p>
              </div>
              <div className="stat-card">
                <h3>{getStatusCount('aprobado')}</h3>
                <p>Aprobados</p>
              </div>
              <div className="stat-card">
                <h3>{getStatusCount('rechazado')}</h3>
                <p>Rechazados</p>
              </div>
            </div>

            {/* --- 2. Reporte de Incidencias --- */}
            <div className="reports-columns">
              <div className="report-card">
                <h3>Incidencias por Severidad</h3>
                <ul className="report-list">
                  {report.incidentSeverityCounts.length > 0 ? (
                    report.incidentSeverityCounts.map(item => (
                      <li key={item._id}>
                        <span className={`severity-badge severity-${item._id}`}>{item._id}</span>
                        <strong>{item.count}</strong> Incidencia(s)
                      </li>
                    ))
                  ) : (
                    <p>No hay incidencias reportadas.</p>
                  )}
                </ul>
              </div>

              {/* --- 3. Reporte por Revisor --- */}
              <div className="report-card">
                <h3>Procesos por Revisor</h3>
                <ul className="report-list">
                  {report.byRevisor.length > 0 ? (
                    report.byRevisor.map(item => (
                      <li key={item.revisorId}>
                        <strong>{item.revisorName}</strong>
                        <span>{item.count} Proceso(s)</span>
                      </li>
                    ))
                   ) : (
                    <p>No hay procesos asignados.</p>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ReportsPage;