# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`
```markdown
# Proyecto TCC: Plataforma Colaborativa (Frontend) 💻

Frontend de la plataforma TCC, construido con React para interactuar con el backend en tiempo real.

## ✨ Tecnologías Utilizadas

* **React.js**: Biblioteca principal para construir la interfaz de usuario.
* **React Router (`react-router-dom`)**: Para la navegación y el manejo de rutas en la aplicación.
* **Axios**: Cliente HTTP para realizar peticiones a la API REST del backend.
* **Socket.io Client**: Para conectarse al servidor de Socket.io y recibir eventos en tiempo real.
* **React Context**: Para el manejo de estado global (Autenticación y Sockets).

## 🔌 Configuración y Primeros Pasos

**IMPORTANTE:** El backend (`tcc-backend`) debe estar ejecutándose en `http://localhost:4000` para que el frontend funcione.

**1. Instalar Dependencias:**
Abre una terminal en esta carpeta (`tcc-frontend`) y ejecuta:
```bash
npm install
▶️ Cómo Ejecutar el Proyecto
Una vez instaladas las dependencias, inicia la aplicación de React:

Bash

npm start
La aplicación se abrirá automáticamente en tu navegador en http://localhost:3000.

📊 Estado Actual y Funcionalidades
El frontend actualmente soporta:

Flujo de Autenticación Completo:

Página de Registro (/register).

Página de Login (/login).

Las rutas están protegidas: Un usuario no logueado no puede acceder al panel principal.

Gestión de Estado Global (Context)

AuthContext: Mantiene la sesión del usuario (quién es, su rol, su token) en toda la app.

SocketContext: Maneja la conexión de Socket.io y la lista de notificaciones.

Panel de Control (Dashboard):

El panel principal muestra el rol del usuario (Ej: Admin TCC (admin) o Diego Ospino (revisor)).

UI basada en Rol:

Si el usuario es 'admin' o 'supervisor', ve el botón + Crear Nuevo Proceso.

Si el usuario es 'revisor', ve el título "Mis Procesos Asignados".

Creación de Procesos: El admin puede hacer clic en el botón, abrir un formulario modal y crear un nuevo proceso asignándoselo a un 'revisor' por email.

Sincronización en Tiempo Real:

La lista de procesos se actualiza en tiempo real al crear uno nuevo.

La columna de Notificaciones recibe y muestra eventos del backend (ej. "Te han asignado un nuevo proceso...").
Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
