/*
 * Página del Dashboard (DashboardPage.js)
 *
 * Esta es la página principal de la aplicación.
 * Muestra el panel de procesos y la barra lateral de notificaciones/chat.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ProcessModal from '../components/ProcessModal';
import ConversationSidebar from '../components/ConversationSidebar'; // El nuevo sidebar

// Un pequeño componente para el badge de estado
const StatusBadge = ({ status }) => {
  return <span className={`status-badge status-${status.replace('_', '-')}`}>{status}</span>;
}

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
      console.log('Socket recibió actualización de proceso:', updatedProcess);
      setProcesses(prevProcesses => 
        prevProcesses.map(p => 
          p._id === updatedProcess._id ? updatedProcess : p
        )
      );
    };

    const handleNewProcess = (newProcess) => {
      console.log('Socket recibió nuevo proceso:', newProcess);
      if (user?.role !== 'revisor' && newProcess.createdBy._id === user?.id) {
         setProcesses(prev => [newProcess, ...prev]);
      } else if (user?.role === 'revisor' && newProcess.assignedTo._id === user?.id) {
         setProcesses(prev => [newProcess, ...prev]);
      }
    };
    
    const handleIncidentCreated = (data) => {
       console.log('Socket recibió nuevo incidente:', data);
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

  const handleProcessCreated = (newProcess) => {
    setProcesses(prev => [newProcess, ...prev]);
  };

  return (
    <div>
      <header className="dashboard-header">
        <h1>TCC - Plataforma de Auditoría</h1>
        <nav>
          {user?.role !== 'revisor' && (
            <Link to="/reports" className="header-nav-link">Reportes</Link>
          )}
          <span className="header-nav-user">
            Bienvenido, {user?.name} ({user?.role})
          </span>
          <button onClick={logout}>Cerrar Sesión</button>
        </nav>
      </header>
      
      <main className="dashboard-main">
        
        <div className="dashboard-processes">
          <h2>Panel de Procesos</h2>
          {user?.role !== 'revisor' && (
            <button onClick={() => setShowModal(true)} style={{ marginBottom: '15px' }}>
              + Crear Nueva Auditoría
            </button>
          )}
          {user?.role === 'revisor' && (
            <h3>Mis Auditorías Asignadas</h3>
          )}
          {loading && <p>Cargando procesos...</p>}
          {error && <p className="auth-error">{error}</p>}
          <div className="process-list">
            {processes.length === 0 && !loading && (
              <p>No hay procesos para mostrar.</p>
            )}
            {processes.map((process) => (
              <Link to={`/process/${process._id}`} key={process._id} className="link-style-reset">
                <div className="process-list-item">
                  <h4>{process.title}</h4>
                  <p>Estado: <StatusBadge status={process.status} /></p>
                  {user?.role !== 'revisor' ? (
                    <p>Asignado a: {process.assignedTo?.name || 'N/A'}</p>
                  ) : (
                    <p>Creado por: {process.createdBy?.name || 'N/A'}</p>
                  )}
                  <p style={{fontSize: '0.8em', color: '#999'}}>Creado: {new Date(process.createdAt).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="dashboard-sidebar">
          <h3>Notificaciones</h3>
          {notifications.length === 0 && (
            <p>No hay notificaciones nuevas.</p>
          )}
          {notifications.map((notif, index) => (
            <div key={index} className="notification-item">
              <p>{notif.message}</p>
              {notif.severity && (
                <small>Severidad: {notif.severity}</small>
              )}
            </div>
          ))}
          <hr style={{margin: '2rem 0'}} />
          
          {/* Aquí va la nueva lista de chats */}
          <ConversationSidebar />
          
        </aside>
        
      </main>

      <ProcessModal 
        show={showModal} 
        onClose={() => setShowModal(false)}
        onProcessCreated={handleProcessCreated}
      />
    </div>
  );
}

export default DashboardPage;