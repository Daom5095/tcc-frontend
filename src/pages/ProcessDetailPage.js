/*
 * Página de Detalle de Proceso (ProcessDetailPage.js)
 *
 * Esta es la página donde ocurre la "magia".
 * - Carga los detalles de UN proceso y sus incidencias.
 * - Si eres Revisor, te muestra un formulario para añadir incidencias.
 * - Si eres Supervisor, te muestra botones para aprobar/rechazar.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

// Componente para el badge de estado
const StatusBadge = ({ status }) => {
  return <span className={`status-badge status-${status.replace('_', '-')}`}>{status}</span>;
}

function ProcessDetailPage() {
  const { id: processId } = useParams(); // Obtengo el ID del proceso desde la URL
  const { user, logout } = useAuth(); // Obtengo mi rol, info Y la función logout
  const { socket } = useSocket(); // Obtengo el socket para escuchar

  const [process, setProcess] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Estado para el formulario de incidencias (con evidencia) ---
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('media');
  const [evidenceText, setEvidenceText] = useState(''); // Campo para evidencia de texto
  const [evidenceLink, setEvidenceLink] = useState(''); // Campo para enlaces
  
  const [formError, setFormError] = useState('');
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
  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    if (description.length < 10) {
      setFormError('La descripción debe tener al menos 10 caracteres.');
      setIsSubmitting(false);
      return;
    }

    // Construimos el array de evidencia
    const evidencePayload = [];
    if (evidenceText.trim()) {
      evidencePayload.push({ type: 'texto', content: evidenceText });
    }
    if (evidenceLink.trim()) {
      if (!evidenceLink.startsWith('http://') && !evidenceLink.startsWith('https://')) {
        setFormError('El enlace debe ser una URL válida (ej. http://...)');
        setIsSubmitting(false);
        return;
      }
      evidencePayload.push({ type: 'enlace', content: evidenceLink });
    }
    
    try {
      // Llamo a la API del backend para crear la incidencia
      await api.post(`/api/processes/${processId}/incidents`, {
        description,
        severity,
        evidence: evidencePayload, // Enviamos la evidencia real
      });
      
      // Limpio todo el formulario
      setDescription('');
      setSeverity('media');
      setEvidenceText('');
      setEvidenceLink('');
      
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al reportar incidencia');
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


  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="auth-error" style={{padding: '2rem'}}>{error} <Link to="/">Volver</Link></div>;
  if (!process) return <div>Proceso no encontrado.</div>;

  return (
    <div>
      <header className="dashboard-header">
        <h1>
          <Link to="/" className="back-button">
            &larr;
          </Link>
          <span className="header-title-static">TCC - Plataforma de Auditoría</span>
        </h1>
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

      {/* Contenido de la página de detalle */}
      <main className="detail-page-main">
        <div className="process-details-card">
          <h1>{process.title}</h1>
          <p><strong>Estado:</strong> <StatusBadge status={process.status} /></p>
          <p><strong>Asignado a:</strong> {process.assignedTo.name} ({process.assignedTo.email})</p>
          <p><strong>Creado por:</strong> {process.createdBy.name} ({process.createdBy.email})</p>
          <p><strong>Descripción:</strong> {process.description || 'No hay descripción.'}</p>
          
          {/* --- ZONA DEL SUPERVISOR --- */}
          {user?.role !== 'revisor' && process.status !== 'aprobado' && process.status !== 'rechazado' && (
            <div className="supervisor-actions">
              <h4>Acciones de Supervisor</h4>
              <p>Revisar las incidencias y tomar una decisión.</p>
              <button className="button-success" onClick={() => handleStatusUpdate('aprobado')}>
                Aprobar Proceso
              </button>
              <button className="button-danger" onClick={() => handleStatusUpdate('rechazado')}>
                Rechazar Proceso
              </button>
            </div>
          )}
        </div>

        {/* Columna de Incidencias */}
        <div className="incidents-column">
          {/* --- ZONA DEL REVISOR --- */}
          {user?.role === 'revisor' && process.status !== 'aprobado' && process.status !== 'rechazado' && (
            <form onSubmit={handleIncidentSubmit} className="incident-form">
              <h3>Reportar Incidencia (Comentario)</h3>
              <div>
                <label htmlFor="severity">Severidad:</label>
                <select 
                  id="severity" 
                  value={severity} 
                  onChange={e => setSeverity(e.target.value)}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div>
                <label htmlFor="description">Descripción:</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe el hallazgo o comentario..."
                  rows={4}
                  required
                />
              </div>

              {/* --- Campos de Evidencia --- */}
              <div>
                <label htmlFor="evidenceText">Evidencia (Texto Opcional):</label>
                <textarea
                  id="evidenceText"
                  value={evidenceText}
                  onChange={e => setEvidenceText(e.target.value)}
                  placeholder="Añade notas de texto..."
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="evidenceLink">Enlace de Evidencia (Opcional):</label>
                <input
                  id="evidenceLink"
                  type="text"
                  value={evidenceLink}
                  onChange={e => setEvidenceLink(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.png"
                />
              </div>

              {formError && <p className="auth-error">{formError}</p>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Incidencia'}
              </button>
            </form>
          )}

          {/* --- LISTA DE INCIDENCIAS --- */}
          <div className="incident-list">
            <h3>Historial de Incidencias</h3>
            {incidents.length === 0 && (
              <p>No se han reportado incidencias para este proceso.</p>
            )}
            {incidents.map(incident => (
              <div key={incident._id} className="incident-item">
                <p><strong>{incident.description}</strong></p>
                <p>
                  <span className={`severity-badge severity-${incident.severity}`}>
                    {incident.severity}
                  </span>
                  reportado por {incident.reportedBy.name}
                </p>
                
                {/* Mostramos la evidencia guardada */}
                {incident.evidence && incident.evidence.length > 0 && (
                  <div className="evidence-display">
                    <strong>Evidencia:</strong>
                    {incident.evidence.map((ev, index) => (
                      <div key={index} className="evidence-item">
                        {ev.type === 'texto' && <p>&#8226; {ev.content}</p>}
                        {ev.type === 'enlace' && (
                          <p>
                            &#8226; <a href={ev.content} target="_blank" rel="noopener noreferrer">
                              Ver Enlace Adjunto
                            </a>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <small>{new Date(incident.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}

export default ProcessDetailPage;