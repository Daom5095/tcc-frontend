/*
 * Componente Modal para Crear Proceso (ProcessModal.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN! ---
 *
 * Este componente usa el Modal y Form de AntD.
 * Se usa para que los Supervisores/Admins puedan crear nuevos procesos.
 */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
// Importamos los componentes de AntD
import { Modal, Form, Input, Button, Alert } from 'antd';

// Recibe props 'open' (para saber si se muestra) y 'onClose' (para cerrarlo)
function ProcessModal({ open, onClose, onProcessCreated }) {
  const [form] = Form.useForm(); // Hook de AntD para controlar el form
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cuando el modal se cierra (sea por OK o Cancelar), reseteamos el form
  const handleClose = () => {
    if (isLoading) return; // No cerrar si está cargando
    setError('');
    form.resetFields();
    onClose();
  };

  // Cuando el formulario se envía y es válido
  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError('');
    try {
      const { data: newProcess } = await api.post('/api/processes', {
        title: values.title,
        description: values.description,
        assignedToEmail: values.assignedToEmail,
      });
      
      // Avisamos al DashboardPage que se creó un proceso
      onProcessCreated(newProcess); 
      handleClose(); // Cierra y resetea el modal
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el proceso');
    }
    setIsLoading(false);
  };

  return (
    <Modal
      title="Crear Nuevo Proceso de Auditoría"
      open={open}
      onCancel={handleClose}
      // Usamos el footer para poner los botones con estado de carga
      footer={[
        <Button key="back" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={isLoading} 
          onClick={() => form.submit()} // Esto dispara el onFinish
        >
          Crear Proceso
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="create_process_form"
        onFinish={handleSubmit} // Se llama al hacer form.submit()
        initialValues={{ description: '' }} // Setea valores iniciales
      >
        {/* Mostramos un error de API si existe */}
        {error && (
          <Form.Item>
            <Alert message={error} type="error" showIcon />
          </Form.Item>
        )}

        <Form.Item
          name="title"
          label="Título del Proceso:"
          rules={[
            { required: true, message: 'Por favor ingresa un título' },
            { min: 5, message: 'Debe tener al menos 5 caracteres' }
          ]}
        >
          <Input placeholder="Ej: Auditoría Trimestral Sede Bogotá" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Descripción (Opcional):"
        >
          <Input.TextArea rows={4} placeholder="Describe los objetivos de esta auditoría..." />
        </Form.Item>
        
        <Form.Item
          name="assignedToEmail"
          label="Asignar a (Email del Revisor):"
          rules={[
            { required: true, message: 'Debes asignar un revisor' },
            { type: 'email', message: 'Por favor ingresa un email válido' }
          ]}
        >
          <Input placeholder="revisor@tcc.local" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ProcessModal;