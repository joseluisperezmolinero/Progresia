const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { 
    iniciarSesion, 
    registrarSerie, 
    obtenerUltimaMarca, 
    finalizarSesion, 
    eliminarSesion,
    obtenerHistorial, 
    obtenerDetalleSesion 
} = require('../controllers/sesion.controller');

// Ruta para iniciar una sesión
router.post('/iniciar', auth, iniciarSesion);

// CU-09: Consultar historial completo del usuario
router.get('/historial', auth, obtenerHistorial); 

// CU-10: Obtener recomendación inteligente de un ejercicio
router.get('/ultima-marca/:id_ejercicio', auth, obtenerUltimaMarca); 

// CU-09: Ver detalle de una sesión concreta
router.get('/:id_sesion/detalle', auth, obtenerDetalleSesion);

// CU-08: Registrar una serie en una sesión concreta
router.post('/:id_sesion/series', auth, registrarSerie); 

// CU-08: Finalizar la sesión
router.put('/:id_sesion/finalizar', auth, finalizarSesion); 

// NUEVO: Cancelar y eliminar una sesión sin guardar (botón Salir)
router.delete('/:id_sesion', auth, eliminarSesion);

module.exports = router;