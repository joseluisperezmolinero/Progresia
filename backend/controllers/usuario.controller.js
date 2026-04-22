const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registrarLog } = require('../services/logSistema.service');

const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellidos, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await pool.query(
      `INSERT INTO usuario (nombre, apellidos, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, apellidos, email`,
      [nombre, apellidos, email, passwordHash]
    );

    await registrarLog({
      id_usuario: nuevoUsuario.rows[0].id_usuario,
      tipo_evento: 'INFO',
      detalle: `Nuevo usuario registrado: ${nuevoUsuario.rows[0].email}`
    });

    res.json(nuevoUsuario.rows[0]);
  } catch (error) {
    console.error(error.message);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ese correo ya está registrado' });
    }

    await registrarLog({
      tipo_evento: 'ERROR',
      detalle: `Error al registrar usuario: ${error.message}`
    });

    res.status(500).send('Error en el servidor al registrar usuario');
  }
};

const iniciarSesion = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await pool.query(
      'SELECT * FROM usuario WHERE email = $1',
      [email]
    );

    if (usuario.rows.length === 0) {
      await registrarLog({
        tipo_evento: 'WARNING',
        detalle: `Intento de inicio de sesión con email inexistente: ${email}`
      });

      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const user = usuario.rows[0];
    const passwordValida = await bcrypt.compare(password, user.password_hash);

    if (!passwordValida) {
      await registrarLog({
        id_usuario: user.id_usuario,
        tipo_evento: 'WARNING',
        detalle: `Contraseña incorrecta para el usuario ${user.email}`
      });

      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id_usuario: user.id_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    await registrarLog({
      id_usuario: user.id_usuario,
      tipo_evento: 'INFO',
      detalle: `Inicio de sesión correcto: ${user.email}`
    });

    res.json({ token });
  } catch (error) {
    console.error(error.message);

    await registrarLog({
      tipo_evento: 'ERROR',
      detalle: `Error en iniciarSesion: ${error.message}`
    });

    res.status(500).send('Error en el servidor al iniciar sesión');
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    const perfil = await pool.query(
      `SELECT id_usuario, nombre, apellidos, email, fecha_registro, es_admin
       FROM usuario
       WHERE id_usuario = $1`,
      [req.usuario]
    );

    if (perfil.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(perfil.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor al obtener el perfil');
  }
};

module.exports = {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil
};