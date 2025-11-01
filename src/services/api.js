/*
 * Servicio de API (api.js)
 *
 * Aquí es donde configuro mi instancia central de Axios.
 * El objetivo es tener un único lugar para definir la URL base del backend
 * y, lo más importante, interceptar CADA petición para adjuntar
 * mi token de autenticación (JWT) automáticamente.
 */
import axios from 'axios';

// 1. URL base de mi backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';// Asegúrate que este sea el puerto de tu backend

// 2. Creamos una instancia de Axios
const api = axios.create({
  baseURL: API_URL,
});
  
// 3. (MUY IMPORTANTE) Interceptor de Peticiones de Axios
// Esto es "mágico": se ejecutará ANTES de CADA petición que hagamos con 'api'.
// Su trabajo es tomar el token del localStorage y añadirlo a los encabezados.
api.interceptors.request.use(
  (config) => {
    // Obtenemos el token de localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Si el token existe, lo añadimos al encabezado 'Authorization'
      // Así, todas mis peticiones a rutas protegidas irán autenticadas
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Manejo de un error antes de que la petición sea enviada
    return Promise.reject(error);
  }
);

export default api;