const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { obtenerResumenGlobal, obtenerEvolucionEjercicio } = require('../controllers/metricas.controller');

// Obtener datos para el dashboard general
router.get('/resumen', auth, obtenerResumenGlobal);

// Obtener datos para la gráfica de un ejercicio concreto
router.get('/evolucion/:id_ejercicio', auth, obtenerEvolucionEjercicio);

module.exports = router;