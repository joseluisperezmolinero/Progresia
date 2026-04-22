const pool = require('../db');

const obtenerEjercicios = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id_ejercicio,
        nombre,
        grupo_muscular,
        imagen_url,
        tipo_ejercicio,
        tipo_registro,
        usa_peso,
        usa_repeticiones,
        usa_duracion,
        usa_distancia,
        series_default,
        descanso_default_segundos,
        reps_min_default,
        reps_max_default,
        duracion_default_segundos,
        distancia_default_metros,
        activo,
        demo_url,
        equipamiento_tipo
      FROM ejercicio
      WHERE activo = true
      ORDER BY nombre ASC
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener ejercicios:', error.message);
    res.status(500).json({ error: 'Error al obtener ejercicios' });
  }
};

module.exports = {
  obtenerEjercicios
};