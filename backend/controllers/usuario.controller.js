const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTRAR USUARIO
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const nuevoUsuario = await pool.query(
            "INSERT INTO usuario (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id_usuario, nombre, email",
            [nombre, email, passwordHash]
        );

        // ✅ CORREGIDO
        res.json(nuevoUsuario.rows[0]);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al registrar usuario");
    }
};

// INICIAR SESIÓN
const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await pool.query(
            "SELECT * FROM usuario WHERE email = $1",
            [email]
        );

        if (usuario.rows.length === 0) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }

        // ✅ CORREGIDO
        const user = usuario.rows[0];

        const passwordValida = await bcrypt.compare(password, user.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }

        // ✅ CORREGIDO
        const token = jwt.sign(
            { id_usuario: user.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '10h' }
        );

        res.json({ token });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al iniciar sesión");
    }
};

// OBTENER PERFIL
const obtenerPerfil = async (req, res) => {
    try {
        const perfil = await pool.query(
            "SELECT id_usuario, nombre, email, fecha_registro, es_admin FROM usuario WHERE id_usuario = $1",
            [req.usuario] 
        );

        if (perfil.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // ✅ CORREGIDO
        res.json(perfil.rows[0]);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al obtener el perfil");
    }
};

module.exports = {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil
};