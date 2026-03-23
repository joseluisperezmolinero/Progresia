# 🏋️‍♂️ Progresia - Backend API (TFG)

Este repositorio contiene la arquitectura Backend y la API RESTful para **Progresia**, una aplicación integral de gestión de entrenamientos y progresión deportiva desarrollada como Trabajo de Fin de Grado (TFG).

## 🛠️ Stack Tecnológico
* **Entorno de ejecución:** Node.js
* **Framework:** Express.js
* **Base de Datos:** PostgreSQL
* **Seguridad:** JSON Web Tokens (JWT) y encriptación con `bcrypt`.
* **Arquitectura:** Modelo Router-Controller (Clean Architecture).

## 🚀 Módulos Implementados (Fase 1)

### 1. Autenticación y Usuarios
* Registro de usuarios con contraseñas encriptadas.
* Login y emisión de pasaportes JWT (Stateless Authentication).
* Middleware de protección de rutas privadas.

### 2. Catálogo de Ejercicios
* Inyección de base de datos relacional estática con ejercicios y grupos musculares.
* Endpoints para listar catálogo completo.

### 3. Gestión de Entrenamientos
* **Transacciones SQL:** Creación simultánea de cabeceras de entrenamiento y relación de ejercicios asegurando la integridad de la base de datos (`BEGIN`, `COMMIT`, `ROLLBACK`).
* Soporte para rutinas personalizadas del usuario y plantillas globales de la aplicación.
* **Consultas Complejas (JOINs):** Endpoint de detalle que unifica las tablas `entrenamiento`, `ejercicio_entrenamiento` y `ejercicio` para servir paquetes de datos completos al Frontend.

## 🔐 Notas de Desarrollo
Este proyecto utiliza variables de entorno (`.env`) para la conexión a la base de datos y la firma de tokens JWT, las cuales están excluidas del control de versiones por motivos de seguridad.