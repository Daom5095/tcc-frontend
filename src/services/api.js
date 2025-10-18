import axios from 'axios';

// 1. URL base de tu backend
const API_URL = 'http://localhost:4000'; // Asegúrate que este sea el puerto de tu backend

// 2. Creamos una instancia de Axios
const api = axios.create({
  baseURL: API_URL,
});

// 3. (MUY IMPORTANTE) Interceptor de Axios
// Esto es "mágico": se ejecutará ANTES de CADA petición.
// Su trabajo es tomar el token del localStorage y añadirlo a los encabezados.
api.interceptors.request.use(
  (config) => {
    // Obtenemos el token de localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Si el token existe, lo añadimos al encabezado 'Authorization'
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    
    return Promise.reject(error);
  }
);

export default api;