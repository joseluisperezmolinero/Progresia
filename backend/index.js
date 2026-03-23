// Importamos las librerías principales
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Inicializamos la aplicación
const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// ==========================================
// ENRUTADOR PRINCIPAL (Pasillos)
// ==========================================
app.use('/api/usuarios', require('./routes/usuario.routes'));
app.use('/api/ejercicios', require('./routes/ejercicio.routes'));
app.use('/api/entrenamientos', require('./routes/entrenamiento.routes')); 

// Definimos el puerto
const PORT = process.env.PORT || 5000;

// Ruta de prueba (la de bienvenida)
app.get('/', (req, res) => {
    res.send('¡Hola José Luis! El servidor de Progresia está funcionando perfectamente 🚀');
});

// Encendemos el motor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});