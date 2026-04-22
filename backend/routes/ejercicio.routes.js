const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { obtenerEjercicios } = require('../controllers/ejercicio.controller');

// RF2.1: El usuario autenticado pide el catálogo para armar su rutina
router.get('/', auth, obtenerEjercicios);

module.exports = router;

