/*
 * Página de Registro (RegisterPage.js)
 * --- ¡VERSIÓN REFACTORIZADA CON ANT DESIGN Y NUEVO NOMBRE! ---
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// Importamos los componentes de AntD que usaremos
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
// Importamos los íconos
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // El formulario de AntD nos da los valores cuando la validación es exitosa
  const onFinish = async (values) => {
    // Ya no necesitamos la validación de 'password.length < 6',
    // AntD la maneja con 'rules'.
    const { name, email, password } = values;
    setError('');
    setIsLoading(true);
    try {
      // Llamo a mi función de registro del AuthContext
      await register(name, email, password);
      // Si todo sale bien, lo mando al dashboard
      navigate('/'); 
    } catch (err) {
      // Si falla (ej. "Usuario ya existe"), muestro el error
      setError(err.response?.data?.message || 'Error al registrarse');
    }
    setIsLoading(false);
  };

  return (
    // Reutilizamos la misma clase de fondo que el Login
    <Space direction="vertical" align="center" className="login-page-background">
      
      {/* Reutilizamos la misma clase de tarjeta animada */}
      <Card className="login-card" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* Ícono alusivo al registro */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <UserOutlined style={{ fontSize: '48px', color: 'var(--color-primario)' }} />
        </div>
        
        {/* --- ¡NOMBRE ACTUALIZADO! --- */}
        <Title level={2} style={{ textAlign: 'center', marginTop: 0 }}>
          Crear Cuenta 
        </Title>
        
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: '¡Por favor ingresa tu nombre!' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nombre Completo" 
              size="large"
            />
          </Form.Item>

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
            rules={[
              { required: true, message: '¡Por favor ingresa tu contraseña!' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres.' }
            ]}
            hasFeedback // Añade un ícono de tick/cruz
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Contraseña" 
              size="large"
            />
          </Form.Item>

          {/* --- ¡MEJORA DE UX! --- */}
          <Form.Item
            name="confirm"
            dependencies={['password']} // Depende del campo 'password'
            hasFeedback
            rules={[
              { required: true, message: '¡Por favor confirma tu contraseña!' },
              // Esta es una regla validadora personalizada de AntD
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('¡Las dos contraseñas no coinciden!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirmar Contraseña" 
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
              {isLoading ? 'Creando...' : 'Crear Cuenta'}
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
          </div>
        </Form>
      </Card>
    </Space>
  );
}

export default RegisterPage;