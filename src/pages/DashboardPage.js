import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext'; 
import api from '../services/api'; 

function DashboardPage() {
  const { user, logout } = useAuth();
  const { notifications } = useSocket(); // Obtenemos las notificaciones

  const [processes, setProcesses] = useState([]); // Estado para la lista de procesos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // useEffect para cargar los procesos cuando la página carga
  useEffect(() => {
    async function fetchProcesses() {
      try {
        setLoading(true);
        setError('');
        // Usamos nuestro 'api' (axios) para pedir los procesos
        const { data } = await api.get('/api/processes');
        setProcesses(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar procesos');
      }
      setLoading(false);
    }

    fetchProcesses();
  }, []); // El array vacío [] significa que esto se ejecuta 1 vez al cargar

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#eee' }}>
        <h1>Plataforma TCC</h1>
        <nav>
          <span style={{ marginRight: '15px' }}>
            Bienvenido, {user?.name} ({user?.role})
          </span>
          <button onClick={logout}>Cerrar Sesión</button>
        </nav>
      </header>
      
      <main style={{ padding: '20px', display: 'flex' }}>
        
        {/* Columna de Procesos */}
        <div style={{ flex: 3, marginRight: '20px' }}>
          <h2>Panel de Procesos</h2>
          
          {/* Lógica para Supervisor (Rol: 'supervisor' o 'admin') */}
          {user?.role !== 'revisor' && (
            <button style={{ marginBottom: '15px' }}>+ Crear Nuevo Proceso</button>
            // TODO: Abrir un modal o formulario para llamar a POST /api/processes
          )}
          
          {/* Lógica para Revisor */}
          {user?.role === 'revisor' && (
            <h3>Mis Procesos Asignados</h3>
          )}

          {/* Lista de Procesos */}
          {loading && <p>Cargando procesos...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <div className="process-list">
            {processes.length === 0 && !loading && (
              <p>No hay procesos para mostrar.</p>
            )}
            
            {processes.map((process) => (
              <div key={process._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                <h4 style={{ marginTop: 0 }}>{process.title}</h4>
                <p>Estado: <strong>{process.status}</strong></p>
                {/* Mostramos a quién se asignó (si eres supervisor) o quién lo creó (si eres revisor) */}
                {user?.role !== 'revisor' ? (
                  <p>Asignado a: {process.assignedTo?.name || 'N/A'}</p>
                ) : (
                  <p>Creado por: {process.createdBy?.name || 'N/A'}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Columna de Notificaciones y Chat */}
        <aside style={{ flex: 1, borderLeft: '2px solid #ddd', paddingLeft: '20px' }}>
          <h3>Notificaciones</h3>
          {notifications.length === 0 && (
            <p>No hay notificaciones nuevas.</p>
          )}
          {notifications.map((notif, index) => (
            <div key={index} style={{ background: '#f4f4f4', padding: '8px', marginBottom: '8px', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{notif.message}</p>
              <small>{notif.severity ? `Severidad: ${notif.severity}` : ''}</small>
            </div>
          ))}

          <hr />
          
          <h3>Chat General</h3>
          {/* TODO: Aquí irá el componente de Chat General */}
          <p>El chat público irá aquí.</p>
        </aside>
        
      </main>
    </div>
  );
}

export default DashboardPage;