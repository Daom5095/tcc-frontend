/*
 * Componente Modal para Crear Proceso (ProcessModal.js)
 * --- ¡MODIFICADO CON SELECT DE REVISOR (MEJORA)! ---
 * --- ¡CORREGIDAS IMPORTACIONES NO USADAS (BUG FIX)! ---
 */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
// --- ¡INICIO DE CAMBIO! ---
import { Modal, Form, Input, Button, Alert, Select } from 'antd'; // <-- 'Spin' eliminado

const { Option } = Select;
// --- ¡FIN DE CAMBIO! ---

function ProcessModal({ open, onClose, onProcessCreated }) {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [revisores, setRevisores] = useState([]);
  const [loadingRevisores, setLoadingRevisores] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchRevisores = async () => {
        setLoadingRevisores(true);
        setError('');
        try {
          const { data } = await api.get('/api/users?role=revisor');
          setRevisores(data);
        } catch (err) {
          setError('Error al cargar la lista de revisores. Asegúrate de que existan usuarios con ese rol.');
        }
        setLoadingRevisores(false);
      };
      
      fetchRevisores();
    } else {
      setRevisores([]);
    }
  }, [open]);


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
        assignedToId: values.assignedToId,
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
          name="assignedToId"
          label="Asignar a (Revisor):"
          rules={[
            { required: true, message: 'Debes asignar un revisor' }
          ]}
        >
          <Select
            loading={loadingRevisores}
            placeholder={loadingRevisores ? "Cargando revisores..." : "Seleccione un revisor"}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {revisores.map(revisor => (
              <Option key={revisor._id} value={revisor._id} label={`${revisor.name} (${revisor.email})`}>
                <div>
                  <strong>{revisor.name}</strong>
                  <br />
                  <span style={{fontSize: '0.9em', color: '#888'}}>{revisor.email}</span>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ProcessModal;