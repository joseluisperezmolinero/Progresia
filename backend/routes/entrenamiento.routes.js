const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { crearEntrenamiento, obtenerEntrenamientos, obtenerEntrenamientoPorId } = require('../controllers/entrenamiento.controller');

// Ruta para crear rutina. ¡Importante poner el 'auth' porque solo usuarios logueados pueden crear!
router.post('/', auth, crearEntrenamiento);

// CU-06: Listar rutinas
router.get('/', auth, obtenerEntrenamientos);

router.get('/:id', auth, obtenerEntrenamientoPorId); // CU-06: Detalle de rutina (con ejercicios incluidos)

module.exports = router;