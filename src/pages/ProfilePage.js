/*
 * Página de Perfil de Usuario (ProfilePage.js)
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppHeader from '../components/AppHeader'; 
import { 
  Layout, Card, Form, Input, Button, Alert, Row, Col, Typography, notification, Spin 
} from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title } = Typography;

function ProfilePage() {
  const { user, updateUserContext } = useAuth(); 
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  
  // Estado para errores de API
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handler para actualizar el nombre
  const handleUpdateProfile = async (values) => {
    setLoadingProfile(true);
    setProfileError('');
    try {
      const { data: updatedUser } = await api.put('/api/users/me', {
        name: values.name,
      });
      
      updateUserContext(updatedUser); 
      
      notification.success({
        message: 'Perfil Actualizado',
        description: 'Tu nombre ha sido actualizado exitosamente.',
      });
      
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Error al actualizar el perfil');
    }
    setLoadingProfile(false);
  };

  // Handler para cambiar la contraseña
  const handleUpdatePassword = async (values) => {
    setLoadingPassword(true);
    setPasswordError('');
    try {
      await api.put('/api/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      notification.success({
        message: 'Contraseña Actualizada',
        description: 'Tu contraseña ha sido cambiada exitosamente.',
      });
      passwordForm.resetFields(); // Limpia el formulario de contraseña
      
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error al cambiar la contraseña');
    }
    setLoadingPassword(false);
  };

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader title="Mi Perfil" backLink="/" />
      
      <Content className="app-content-detail"> 
        <Title level={2} style={{ marginBottom: '2rem' }}>Configuración de mi Perfil</Title>
        <Row gutter={[24, 24]}>
          
          {/* Columna 1: Actualizar Datos Personales */}
          <Col xs={24} md={12}>
            <Card title="Datos Personales" bordered={false} style={{ boxShadow: 'var(--sombra)' }}>
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleUpdateProfile}
                initialValues={{
                  name: user.name,
                  email: user.email, // El email no se puede cambiar
                }}
              >
                {profileError && <Alert message={profileError} type="error" showIcon style={{ marginBottom: '1rem' }} />}

                <Form.Item
                  name="name"
                  label="Nombre Completo"
                  rules={[{ required: true, message: 'Tu nombre es obligatorio' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Tu nombre" />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  label="Email (No se puede cambiar)"
                >
                  <Input prefix={<UserOutlined />} disabled />
                </Form.Item>
                
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loadingProfile} icon={<SaveOutlined />}>
                    Guardar Cambios
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          
          {/* Columna 2: Cambiar Contraseña */}
          <Col xs={24} md={12}>
            <Card title="Cambiar Contraseña" bordered={false} style={{ boxShadow: 'var(--sombra)' }}>
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleUpdatePassword}
              >
                {passwordError && <Alert message={passwordError} type="error" showIcon style={{ marginBottom: '1rem' }} />}

                <Form.Item
                  name="currentPassword"
                  label="Contraseña Actual"
                  rules={[{ required: true, message: 'Ingresa tu contraseña actual' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Tu contraseña actual" />
                </Form.Item>
                
                <Form.Item
                  name="newPassword"
                  label="Nueva Contraseña"
                  rules={[
                    { required: true, message: 'Ingresa tu nueva contraseña' },
                    { min: 6, message: 'Debe tener al menos 6 caracteres' }
                  ]}
                  hasFeedback 
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Nueva contraseña (mín. 6 caracteres)" />
                </Form.Item>
                
                <Form.Item
                  name="confirmPassword"
                  label="Confirmar Nueva Contraseña"
                  dependencies={['newPassword']} // Depende del campo 'newPassword'
                  hasFeedback
                  rules={[
                    { required: true, message: 'Confirma tu nueva contraseña' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Las contraseñas no coinciden'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Repite la nueva contraseña" />
                </Form.Item>
                
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loadingPassword} icon={<SaveOutlined />}>
                    Actualizar Contraseña
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default ProfilePage;