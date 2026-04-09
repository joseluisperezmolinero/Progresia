const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  crearEntrenamiento,
  obtenerEntrenamientos,
  obtenerEntrenamientoPorId,
  eliminarEntrenamiento
} = require('../controllers/entrenamiento.controller');

// Crear rutina
router.post('/', auth, crearEntrenamiento);

// Listar rutinas
router.get('/', auth, obtenerEntrenamientos);

// Detalle de una rutina
router.get('/:id', auth, obtenerEntrenamientoPorId);

// Eliminar una rutina
router.delete('/:id', auth, eliminarEntrenamiento);

module.exports = router;