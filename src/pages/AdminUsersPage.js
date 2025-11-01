/*
 * Página de Administración de Usuarios (AdminUsersPage.js)
 * Creada para (FASE 3 - PASO 9)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppHeader from '../components/AppHeader';
import { 
  Layout, Typography, Table, Select, Switch, Tag, 
  Spin, Alert, message // message es para popups de éxito/error
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function AdminUsersPage() {
  const { user } = useAuth(); // Para obtener mi propio ID
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Función para cargar todos los usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/users/admin/all');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
    }
    setLoading(false);
  }, []);

  // Cargar usuarios al montar la página
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler para cambiar el ROL de un usuario
  const handleRoleChange = async (userId, newRole) => {
    if (userId === user.id) {
      message.error('No puedes cambiar tu propio rol.');
      return;
    }
    
    try {
      // 1. Llamar a la API
      const { data: updatedUser } = await api.put(`/api/users/admin/${userId}/role`, { role: newRole });
      
      // 2. Actualizar el estado local para ver el cambio al instante
      setUsers(prevUsers => 
        prevUsers.map(u => u._id === userId ? updatedUser : u)
      );
      message.success(`Rol de ${updatedUser.name} actualizado a ${updatedUser.role}`);
      
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al cambiar el rol');
      // Revertir el cambio visual si falla (opcional, pero buena UX)
      fetchUsers();
    }
  };

  // Handler para cambiar el ESTADO (activo/inactivo) de un usuario
  const handleStatusChange = async (userId, newStatus) => {
    if (userId === user.id) {
      message.error('No puedes desactivar tu propia cuenta.');
      return;
    }
    
    try {
      // 1. Llamar a la API
      const { data: updatedUser } = await api.put(`/api/users/admin/${userId}/status`, { isActive: newStatus });

      // 2. Actualizar el estado local
      setUsers(prevUsers => 
        prevUsers.map(u => u._id === userId ? updatedUser : u)
      );
      message.success(`Cuenta de ${updatedUser.name} ${newStatus ? 'activada' : 'desactivada'}`);
      
    } catch (err) {
      message.error(err.response?.data?.message || 'Error al cambiar el estado');
      fetchUsers(); // Revertir
    }
  };

  // Definición de las columnas para la Tabla de AntD
  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Supervisor', value: 'supervisor' },
        { text: 'Revisor', value: 'revisor' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 120 }}
          onChange={(newRole) => handleRoleChange(record._id, newRole)}
          disabled={record._id === user.id} // Deshabilitado para mi propia cuenta
        >
          <Option value="admin">Admin</Option>
          <Option value="supervisor">Supervisor</Option>
          <Option value="revisor">Revisor</Option>
        </Select>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive, record) => (
        <Space>
          <Switch
            checkedChildren={<CheckOutlined />}
            unCheckedChildren={<CloseOutlined />}
            checked={isActive}
            onChange={(checked) => handleStatusChange(record._id, checked)}
            disabled={record._id === user.id} // Deshabilitado para mi propia cuenta
          />
          <Tag color={isActive ? 'success' : 'error'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Miembro Desde',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader title="Panel de Administración" backLink="/" />
      
      <Content className="app-content-detail">
        <Title level={2}>Gestión de Usuarios</Title>
        <Text type="secondary">
          Aquí puedes editar los roles y el estado de todos los usuarios del sistema.
        </Text>
        
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message={error} type="error" showIcon style={{ marginTop: '20px' }} />
        ) : (
          <Table
            dataSource={users}
            columns={columns}
            rowKey="_id" // Usa el _id de MongoDB como key
            style={{ marginTop: '24px', overflowX: 'auto' }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Content>
    </Layout>
  );
}

export default AdminUsersPage;