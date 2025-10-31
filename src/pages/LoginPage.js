/*
 * Página de Login (LoginPage.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN! ---
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// Importamos los componentes de AntD que usaremos
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
// Importamos los íconos
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // AntD maneja el estado del formulario internamente
  const onFinish = async (values) => {
    const { email, password } = values; // 'values' viene de AntD
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
    setIsLoading(false);
  };

  return (
    // Usamos 'Space' y 'Card' de AntD para centrar y estilizar
    <Space direction="vertical" align="center" style={{ width: '100%', minHeight: '100vh', background: '#f0f2f5', paddingTop: '50px' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Title level={2} style={{ textAlign: 'center' }}>
          Iniciar Sesión (TCC)
        </Title>
        
        {/* El formulario de AntD maneja el 'onSubmit' con onFinish */}
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '¡Por favor ingresa tu email!' },
              { type: 'email', message: '¡El email no es válido!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '¡Por favor ingresa tu contraseña!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Contraseña" 
              size="large"
            />
          </Form.Item>

          {/* Mostramos el error en un 'Alert' de AntD */}
          {error && (
            <Form.Item>
              <Alert message={error} type="error" showIcon />
            </Form.Item>
          )}

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading} 
              style={{ width: '100%' }}
              size="large"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </div>
        </Form>
      </Card>
    </Space>
  );
}

export default LoginPage;