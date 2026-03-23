const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { registrarUsuario, iniciarSesion, obtenerPerfil } = require('../controllers/usuario.controller');

// Las rutas completas serán /api/usuarios/registro, etc.
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/perfil', auth, obtenerPerfil); // <-- Solo el perfil pide Token

module.exports = router;