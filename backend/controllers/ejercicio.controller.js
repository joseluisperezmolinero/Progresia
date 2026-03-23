const pool = require('../db');

// Crear ejercicio
const crearEjercicio = async (req, res) => {
    try {
        const { nombre, grupo_muscular, imagen_url } = req.body;

        const nuevoEjercicio = await pool.query(
            "INSERT INTO ejercicio (nombre, grupo_muscular, imagen_url) VALUES ($1, $2, $3) RETURNING *",
            [nombre, grupo_muscular, imagen_url]
        );

        // ✅ devolver solo el objeto, no el array
        res.json(nuevoEjercicio.rows[0]);

    } catch (error) {
        console.error(error.message);

        if (error.code === '23505') {
            return res.status(400).json({ error: "Este ejercicio ya existe en el catálogo." });
        }

        res.status(500).send("Error en el servidor al crear el ejercicio");
    }
};

// Obtener ejercicios
const obtenerEjercicios = async (req, res) => {
    try {
        const ejercicios = await pool.query(
            "SELECT * FROM ejercicio ORDER BY nombre ASC"
        );

        res.json(ejercicios.rows);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al obtener los ejercicios");
    }
};

module.exports = {
    crearEjercicio,
    obtenerEjercicios
};