/*
 * Componente Modal para Crear Proceso (ProcessModal.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN! ---
 */
// --- MODIFICADO: 'useEffect' eliminado de la importación ---
import React, { useState } from 'react';
import api from '../services/api';
import { Modal, Form, Input, Button, Alert } from 'antd';

function ProcessModal({ open, onClose, onProcessCreated }) {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (isLoading) return;
    setError('');
    form.resetFields();
    onClose();
  };

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError('');
    try {
      const { data: newProcess } = await api.post('/api/processes', {
        title: values.title,
        description: values.description,
        assignedToEmail: values.assignedToEmail,
      });
      
      onProcessCreated(newProcess); 
      handleClose(); 
      
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
      footer={[
        <Button key="back" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={isLoading} 
          onClick={() => form.submit()}
        >
          Crear Proceso
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="create_process_form"
        onFinish={handleSubmit}
        initialValues={{ description: '' }}
      >
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