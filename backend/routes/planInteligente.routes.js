const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const {
  generarPreview,
  guardarPlan,
  obtenerPlanes,
  obtenerPlanPorId,
  eliminarPlan
} = require('../controllers/planInteligente.controller');

router.post('/preview', auth, generarPreview);
router.post('/', auth, guardarPlan);
router.get('/', auth, obtenerPlanes);
router.get('/:id', auth, obtenerPlanPorId);
router.delete('/:id', auth, eliminarPlan);

module.exports = router;