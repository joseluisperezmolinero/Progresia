const pool = require('../db');

const obtenerResumenGlobal = async (req, res) => {
    try {
        const consulta = `
            SELECT
                COUNT(DISTINCT se.id_sesion) FILTER (WHERE se.fecha_fin IS NOT NULL) AS total_sesiones,
                COALESCE(SUM(COALESCE(rs.peso_kg, 0) * COALESCE(rs.repeticiones, 0)), 0) AS volumen_total_kg,
                COALESCE(SUM(COALESCE(rs.distancia_metros, 0)), 0) AS distancia_total_metros,
                COALESCE(SUM(COALESCE(rs.duracion_segundos, 0)), 0) AS duracion_total_segundos
            FROM sesion_entrenamiento se
            LEFT JOIN registro_serie rs ON rs.id_sesion = se.id_sesion
            WHERE se.id_usuario = $1
        `;

        const resultado = await pool.query(consulta, [req.usuario]);
        const fila = resultado.rows[0] || {};

        res.json({
            total_sesiones: parseInt(fila.total_sesiones, 10) || 0,
            volumen_total_kg: parseFloat(fila.volumen_total_kg) || 0,
            distancia_total_metros: parseFloat(fila.distancia_total_metros) || 0,
            duracion_total_segundos: parseInt(fila.duracion_total_segundos, 10) || 0
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error al obtener las métricas globales');
    }
};

const obtenerEvolucionEjercicio = async (req, res) => {
    try {
        const { id_ejercicio } = req.params;

        const metaEjercicio = await pool.query(
            `SELECT id_ejercicio, nombre, grupo_muscular, tipo_registro
             FROM ejercicio
             WHERE id_ejercicio = $1`,
            [id_ejercicio]
        );

        if (metaEjercicio.rows.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }

        const consulta = `
            SELECT 
                DATE(se.fecha_inicio) AS fecha,
                MAX(COALESCE(rs.peso_kg, 0)) AS peso_maximo,
                MAX(COALESCE(rs.repeticiones, 0)) AS reps_maximas,
                SUM(COALESCE(rs.repeticiones, 0)) AS reps_totales,
                SUM(COALESCE(rs.peso_kg, 0) * COALESCE(rs.repeticiones, 0)) AS volumen_sesion,
                MAX(COALESCE(rs.duracion_segundos, 0)) AS duracion_maxima,
                SUM(COALESCE(rs.duracion_segundos, 0)) AS duracion_total_segundos,
                MAX(COALESCE(rs.distancia_metros, 0)) AS distancia_maxima,
                SUM(COALESCE(rs.distancia_metros, 0)) AS distancia_total_metros
            FROM registro_serie rs
            JOIN sesion_entrenamiento se ON rs.id_sesion = se.id_sesion
            WHERE se.id_usuario = $1
              AND rs.id_ejercicio = $2
              AND se.fecha_fin IS NOT NULL
            GROUP BY DATE(se.fecha_inicio)
            ORDER BY fecha ASC
        `;

        const evolucion = await pool.query(consulta, [req.usuario, id_ejercicio]);

        res.json({
            ejercicio: metaEjercicio.rows[0],
            evolucion: evolucion.rows.map(fila => ({
                fecha: fila.fecha,
                peso_maximo: parseFloat(fila.peso_maximo) || 0,
                reps_maximas: parseInt(fila.reps_maximas, 10) || 0,
                reps_totales: parseInt(fila.reps_totales, 10) || 0,
                volumen_sesion: parseFloat(fila.volumen_sesion) || 0,
                duracion_maxima: parseInt(fila.duracion_maxima, 10) || 0,
                duracion_total_segundos: parseInt(fila.duracion_total_segundos, 10) || 0,
                distancia_maxima: parseFloat(fila.distancia_maxima) || 0,
                distancia_total_metros: parseFloat(fila.distancia_total_metros) || 0
            }))
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error al obtener la evolución del ejercicio');
    }
};

module.exports = {
    obtenerResumenGlobal,
    obtenerEvolucionEjercicio
};