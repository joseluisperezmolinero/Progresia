const pool = require('../db');

// CU-10: Obtener métricas globales del usuario (Para el Dashboard principal)
const obtenerResumenGlobal = async (req, res) => {
    try {
        // 1. Total de sesiones completadas
        const resSesiones = await pool.query(
            "SELECT COUNT(*) AS total_sesiones FROM sesion_entrenamiento WHERE id_usuario = $1 AND fecha_fin IS NOT NULL",
            [req.usuario]
        );

        // 2. Volumen total levantado en toda su historia (Suma de Peso x Repeticiones)
        const resVolumen = await pool.query(`
            SELECT SUM(rs.peso_kg * rs.repeticiones) AS volumen_total_kg
            FROM registro_serie rs
            JOIN sesion_entrenamiento se ON rs.id_sesion = se.id_sesion
            WHERE se.id_usuario = $1
        `, [req.usuario]);

        res.json({
            total_sesiones: parseInt(resSesiones.rows[0].total_sesiones) || 0,
            volumen_total_kg: parseFloat(resVolumen.rows[0].volumen_total_kg) || 0
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error al obtener las métricas globales");
    }
};

// CU-10: Obtener datos evolutivos de un ejercicio para pintar una gráfica en React
const obtenerEvolucionEjercicio = async (req, res) => {
    try {
        const { id_ejercicio } = req.params;

        // Agrupamos por fecha para saber el peso MÁXIMO levantado cada día en ese ejercicio
        const consulta = `
            SELECT 
                DATE(se.fecha_inicio) AS fecha,
                MAX(rs.peso_kg) AS peso_maximo,
                SUM(rs.peso_kg * rs.repeticiones) AS volumen_sesion
            FROM registro_serie rs
            JOIN sesion_entrenamiento se ON rs.id_sesion = se.id_sesion
            WHERE se.id_usuario = $1 AND rs.id_ejercicio = $2 AND se.fecha_fin IS NOT NULL
            GROUP BY DATE(se.fecha_inicio)
            ORDER BY fecha ASC
        `;

        const evolucion = await pool.query(consulta, [req.usuario, id_ejercicio]);

        res.json(evolucion.rows);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error al obtener la evolución del ejercicio");
    }
};

module.exports = {
    obtenerResumenGlobal,
    obtenerEvolucionEjercicio
};