const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const verificarAdmin = require('../middlewares/verificarAdmin');

const {
  obtenerResumenSistema,
  obtenerLogsSistema,
  obtenerIncidencias,
  crearIncidencia,
  actualizarIncidencia,
  obtenerUsuarios,
  actualizarRolAdmin,
  actualizarUsuarioAdmin,
  eliminarUsuarioAdmin,
  obtenerEjerciciosAdmin,
  crearEjercicioAdmin,
  actualizarEjercicioAdmin,
  cambiarActivoEjercicioAdmin
} = require('../controllers/admin.controller');

router.use(auth, verificarAdmin);

router.get('/resumen', obtenerResumenSistema);
router.get('/logs', obtenerLogsSistema);

router.get('/incidencias', obtenerIncidencias);
router.post('/incidencias', crearIncidencia);
router.put('/incidencias/:id', actualizarIncidencia);

router.get('/usuarios', obtenerUsuarios);
router.put('/usuarios/:id/rol', actualizarRolAdmin);
router.put('/usuarios/:id', actualizarUsuarioAdmin);
router.delete('/usuarios/:id', eliminarUsuarioAdmin);

router.get('/ejercicios', obtenerEjerciciosAdmin);
router.post('/ejercicios', crearEjercicioAdmin);
router.put('/ejercicios/:id', actualizarEjercicioAdmin);
router.patch('/ejercicios/:id/activo', cambiarActivoEjercicioAdmin);

module.exports = router;