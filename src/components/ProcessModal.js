/*
 * Componente Modal para Crear Proceso (ProcessModal.js)
 *
 * Este es un formulario dentro de un modal <dialog> de HTML5.
 * Se usa para que los Supervisores/Admins puedan crear nuevos procesos.
 */
import React, { useState } from 'react';
import api from '../services/api';

// Recibe props 'show' (para saber si se muestra) y 'onClose' (para cerrarlo)
function ProcessModal({ show, onClose, onProcessCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToEmail, setAssignedToEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Usamos el elemento <dialog> de HTML5.
  // 'ref' nos permite controlarlo (abrir/cerrar)
  const dialogRef = React.useRef(null);

  // Sincronizamos el estado 'show' con el modal
  React.useEffect(() => {
    if (show) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data: newProcess } = await api.post('/api/processes', {
        title,
        description,
        assignedToEmail,
      });
      // Limpiamos el formulario
      setTitle('');
      setDescription('');
      setAssignedToEmail('');
      // Avisamos al DashboardPage que se creó un proceso
      onProcessCreated(newProcess); 
      onClose(); // Cerramos el modal
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el proceso');
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    // Reseteamos el formulario al cerrar
    setError('');
    setIsLoading(false);
    onClose();
  }

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="modal">
      <div className="modal-header">
        <h3>Crear Nuevo Proceso</h3>
        <button onClick={handleClose}>&times;</button>
      </div>
      <form onSubmit={handleSubmit} className="modal-form">
        <div>
          <label htmlFor="title">Título del Proceso:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Descripción (Opcional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email">Asignar a (Email del Revisor):</label>
          <input
            id="email"
            type="email"
            value={assignedToEmail}
            onChange={(e) => setAssignedToEmail(e.target.value)}
            required
            placeholder="revisor@tcc.local"
          />
        </div>
        
        {error && <p className="auth-error">{error}</p>}
        
        <div className="modal-actions">
          <button type="button" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creando...' : 'Crear Proceso'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default ProcessModal;