const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { iniciarSesion, registrarSerie, obtenerUltimaMarca, finalizarSesion, obtenerHistorial, obtenerDetalleSesion } = require('../controllers/sesion.controller');

// Ruta para iniciar una sesión (Ej: POST /api/sesiones/iniciar)
router.post('/iniciar', auth, iniciarSesion);

// CU-09: Consultar historial completo del usuario
router.get('/historial', auth, obtenerHistorial); 

// CU-10: Obtener recomendación inteligente de un ejercicio
router.get('/ultima-marca/:id_ejercicio', auth, obtenerUltimaMarca); 

// CU-09: Ver detalle de una sesión concreta (Ej: GET /api/sesiones/6/detalle)
router.get('/:id_sesion/detalle', auth, obtenerDetalleSesion);

// CU-08: Registrar una serie en una sesión concreta
router.post('/:id_sesion/series', auth, registrarSerie); 

// CU-08: Finalizar la sesión (Ej: PUT /api/sesiones/6/finalizar)
router.put('/:id_sesion/finalizar', auth, finalizarSesion); 



module.exports = router;