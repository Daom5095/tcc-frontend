/*
 * Componente Modal para Crear Proceso (ProcessModal.js)
 * --- ¡MODIFICADO CON SELECT DE REVISOR (MEJORA)! ---
 */
import React, { useState, useEffect } from 'react'; // <-- Importamos useEffect
import api from '../services/api';
// --- ¡INICIO DE CAMBIO! ---
import { Modal, Form, Input, Button, Alert, Select, Spin } from 'antd';

const { Option } = Select;
// --- ¡FIN DE CAMBIO! ---

function ProcessModal({ open, onClose, onProcessCreated }) {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- ¡INICIO DE CÓDIGO NUEVO! ---
  // Estado para la lista de revisores
  const [revisores, setRevisores] = useState([]);
  const [loadingRevisores, setLoadingRevisores] = useState(false);

  // Efecto para cargar los revisores cuando se abre el modal
  useEffect(() => {
    if (open) {
      const fetchRevisores = async () => {
        setLoadingRevisores(true);
        setError(''); // Limpia errores antiguos
        try {
          // Llamamos a la API que modificamos en el backend
          const { data } = await api.get('/api/users?role=revisor');
          setRevisores(data);
        } catch (err) {
          setError('Error al cargar la lista de revisores. Asegúrate de que existan usuarios con ese rol.');
        }
        setLoadingRevisores(false);
      };
      
      fetchRevisores();
    } else {
      // Limpia la lista cuando se cierra el modal
      setRevisores([]);
    }
  }, [open]); // Este efecto se dispara cada vez que 'open' cambia
  // --- ¡FIN DE CÓDIGO NUEVO! ---


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
      // --- ¡INICIO DE CAMBIO! ---
      // Enviamos el ID en lugar del email
      const { data: newProcess } = await api.post('/api/processes', {
        title: values.title,
        description: values.description,
        assignedToId: values.assignedToId, // <-- Campo actualizado
      });
      // --- ¡FIN DE CAMBIO! ---
      
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
        {/* Mostramos error si falla la carga de revisores o la creación */}
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
        
        {/* --- ¡INICIO DE CAMBIO! --- */}
        {/* Reemplazamos el Input de Email por un Select */}
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
            optionFilterProp="children" // Permite buscar por el texto del 'label'
            // Filtro manual para buscar por nombre o email
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {/* Generamos las opciones del dropdown a partir 
              de nuestro estado 'revisores'
            */}
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
        {/* --- ¡FIN DE CAMBIO! --- */}

      </Form>
    </Modal>
  );
}

export default ProcessModal;