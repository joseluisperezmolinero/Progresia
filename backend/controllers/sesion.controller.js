const pool = require('../db');

const toNullableNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
};

const iniciarSesion = async (req, res) => {
    try {
        const { id_entrenamiento, notas } = req.body;

        const nuevaSesion = await pool.query(
            `INSERT INTO sesion_entrenamiento 
            (id_usuario, id_entrenamiento, fecha_inicio, notas) 
            VALUES ($1, $2, NOW(), $3) 
            RETURNING *`,
            [
                req.usuario,
                id_entrenamiento || null,
                notas || null
            ]
        );

        res.status(201).json({
            mensaje: 'Sesión iniciada con éxito. ¡A darle duro!',
            sesion: nuevaSesion.rows[0]
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor al iniciar la sesión');
    }
};

const registrarSerie = async (req, res) => {
    try {
        const { id_sesion } = req.params;
        const {
            id_ejercicio,
            num_serie,
            peso_kg,
            repeticiones,
            duracion_segundos,
            distancia_metros,
            rpe_fatiga
        } = req.body;

        if (!id_ejercicio || !num_serie || rpe_fatiga == null) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para registrar la serie' });
        }

        const checkSesion = await pool.query(
            `SELECT id_sesion
             FROM sesion_entrenamiento
             WHERE id_sesion = $1 AND id_usuario = $2`,
            [id_sesion, req.usuario]
        );

        if (checkSesion.rows.length === 0) {
            return res.status(404).json({ error: 'Sesión no encontrada o no autorizada' });
        }

        const infoEjercicio = await pool.query(
            `SELECT 
                id_ejercicio,
                nombre,
                tipo_registro,
                usa_peso,
                usa_repeticiones,
                usa_duracion,
                usa_distancia
             FROM ejercicio
             WHERE id_ejercicio = $1`,
            [id_ejercicio]
        );

        if (infoEjercicio.rows.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }

        const ejercicio = infoEjercicio.rows[0];

        const serieFinal = Number(num_serie);
        const rpeFinal = Number(rpe_fatiga);
        const pesoFinal = ejercicio.usa_peso ? toNullableNumber(peso_kg) : null;
        const repsFinal = ejercicio.usa_repeticiones ? toNullableNumber(repeticiones) : null;
        const duracionFinal = ejercicio.usa_duracion ? toNullableNumber(duracion_segundos) : null;
        const distanciaFinal = ejercicio.usa_distancia ? toNullableNumber(distancia_metros) : null;

        if (Number.isNaN(serieFinal) || serieFinal <= 0) {
            return res.status(400).json({ error: 'El número de serie no es válido' });
        }

        if (Number.isNaN(rpeFinal) || rpeFinal < 1 || rpeFinal > 10) {
            return res.status(400).json({ error: 'El RPE debe estar entre 1 y 10' });
        }

        if (ejercicio.usa_peso && (pesoFinal == null || pesoFinal < 0)) {
            return res.status(400).json({ error: 'El peso es obligatorio y debe ser mayor o igual a 0' });
        }

        if (ejercicio.usa_repeticiones && (repsFinal == null || repsFinal <= 0)) {
            return res.status(400).json({ error: 'Las repeticiones son obligatorias y deben ser mayores que 0' });
        }

        if (ejercicio.usa_duracion && (duracionFinal == null || duracionFinal <= 0)) {
            return res.status(400).json({ error: 'La duración es obligatoria y debe ser mayor que 0' });
        }

        if (ejercicio.usa_distancia && (distanciaFinal == null || distanciaFinal <= 0)) {
            return res.status(400).json({ error: 'La distancia es obligatoria y debe ser mayor que 0' });
        }

        const nuevaSerie = await pool.query(
            `INSERT INTO registro_serie
                (id_sesion, id_ejercicio, num_serie, peso_kg, repeticiones, duracion_segundos, distancia_metros, rpe_fatiga)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                id_sesion,
                id_ejercicio,
                serieFinal,
                pesoFinal,
                repsFinal,
                duracionFinal,
                distanciaFinal,
                rpeFinal
            ]
        );

        res.status(201).json({
            mensaje: `Serie ${serieFinal} registrada correctamente`,
            serie: nuevaSerie.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar la serie:', error.message);
        res.status(500).json({
            error: 'Error en el servidor al registrar la serie',
            detalle: error.message
        });
    }
};

const obtenerUltimaMarca = async (req, res) => {
    try {
        const { id_ejercicio } = req.params;
        const id_usuario = req.usuario;

        const consulta = `
            SELECT 
                rs.peso_kg,
                rs.repeticiones,
                rs.duracion_segundos,
                rs.distancia_metros,
                rs.rpe_fatiga,
                se.fecha_inicio,
                e.nombre,
                e.grupo_muscular,
                e.tipo_registro
            FROM registro_serie rs
            JOIN sesion_entrenamiento se ON rs.id_sesion = se.id_sesion
            JOIN ejercicio e ON rs.id_ejercicio = e.id_ejercicio
            WHERE rs.id_ejercicio = $1 AND se.id_usuario = $2
            ORDER BY se.fecha_inicio DESC, rs.num_serie DESC
            LIMIT 1;
        `;

        const resultado = await pool.query(consulta, [id_ejercicio, id_usuario]);

        if (resultado.rows.length === 0) {
            return res.json({
                mensaje: 'Primera vez haciendo este ejercicio.',
                sugerencia: 'Registra una primera marca base para empezar a comparar.'
            });
        }

        const ultimaMarca = resultado.rows[0];
        let sugerencia = 'Intenta igualar o mejorar ligeramente tu última marca.';

        if (ultimaMarca.tipo_registro === 'peso_reps') {
            if (ultimaMarca.repeticiones >= 10 && ultimaMarca.rpe_fatiga <= 8) {
                sugerencia = `¡Vas sobrado! Sube el peso a ${parseFloat(ultimaMarca.peso_kg || 0) + 2.5} kg.`;
            } else if (ultimaMarca.rpe_fatiga >= 9 && ultimaMarca.repeticiones < 8) {
                sugerencia = 'La última vez te costó bastante. Mantén el peso o bájalo un poco.';
            } else {
                sugerencia = 'Mantén el peso e intenta sacar una repetición más.';
            }
        } else if (ultimaMarca.tipo_registro === 'reps') {
            sugerencia = 'Intenta mejorar tu marca con 1-2 repeticiones más manteniendo la técnica.';
        } else if (ultimaMarca.tipo_registro === 'duracion') {
            sugerencia = 'Intenta aumentar un poco el tiempo o mantenerlo con menor sensación de esfuerzo.';
        } else if (ultimaMarca.tipo_registro === 'distancia_duracion') {
            sugerencia = 'Intenta recorrer más distancia en el mismo tiempo o repetir la distancia con menos fatiga.';
        }

        res.json({
            ultima_marca: ultimaMarca,
            sugerencia_ia: sugerencia
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor al calcular la sugerencia');
    }
};

const finalizarSesion = async (req, res) => {
    try {
        const { id_sesion } = req.params;
        const { notas } = req.body;

        const sesionFinalizada = await pool.query(
            `UPDATE sesion_entrenamiento
             SET fecha_fin = NOW(), notas = $1
             WHERE id_sesion = $2 AND id_usuario = $3
             RETURNING *`,
            [notas || null, id_sesion, req.usuario]
        );

        if (sesionFinalizada.rows.length === 0) {
            return res.status(404).json({ error: 'Sesión no encontrada o no autorizada' });
        }

        res.json({
            mensaje: '¡Entrenamiento finalizado! Buen trabajo, a descansar.',
            sesion: sesionFinalizada.rows[0]
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor al finalizar la sesión');
    }
};

const eliminarSesion = async (req, res) => {
    try {
        const { id_sesion } = req.params;
        const id_usuario = req.usuario;

        await pool.query(
            `DELETE FROM registro_serie 
             WHERE id_sesion = $1 
             AND id_sesion IN (
                SELECT id_sesion FROM sesion_entrenamiento WHERE id_usuario = $2
             )`,
            [id_sesion, id_usuario]
        );

        const resultado = await pool.query(
            `DELETE FROM sesion_entrenamiento 
             WHERE id_sesion = $1 AND id_usuario = $2`,
            [id_sesion, id_usuario]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Sesión no encontrada o no autorizada' });
        }

        res.json({ mensaje: 'Sesión cancelada y eliminada correctamente' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor al eliminar la sesión');
    }
};

const obtenerHistorial = async (req, res) => {
    try {
        const consulta = `
            SELECT 
                s.id_sesion, 
                s.fecha_inicio, 
                s.fecha_fin, 
                s.notas, 
                e.nombre AS nombre_rutina,
                ROUND(EXTRACT(EPOCH FROM (s.fecha_fin - s.fecha_inicio)) / 60) AS duracion_minutos
            FROM sesion_entrenamiento s
            LEFT JOIN entrenamiento e ON s.id_entrenamiento = e.id_entrenamiento
            WHERE s.id_usuario = $1
            ORDER BY s.fecha_inicio DESC
        `;

        const historial = await pool.query(consulta, [req.usuario]);
        res.json(historial.rows);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor al obtener el historial');
    }
};

const obtenerDetalleSesion = async (req, res) => {
    try {
        const { id_sesion } = req.params;

        const consulta = `
            SELECT 
                rs.id_serie,
                rs.num_serie,
                rs.peso_kg,
                rs.repeticiones,
                rs.duracion_segundos,
                rs.distancia_metros,
                rs.rpe_fatiga,

                e.nombre AS nombre_ejercicio,
                e.grupo_muscular,
                e.tipo_registro,
                e.usa_peso,
                e.usa_repeticiones,
                e.usa_duracion,
                e.usa_distancia
            FROM registro_serie rs
            JOIN ejercicio e ON rs.id_ejercicio = e.id_ejercicio
            WHERE rs.id_sesion = $1
            ORDER BY rs.id_ejercicio, rs.num_serie ASC
        `;

        const detalle = await pool.query(consulta, [id_sesion]);
        res.json(detalle.rows);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor al obtener el detalle de la sesión');
    }
};

module.exports = {
    iniciarSesion,
    registrarSerie,
    obtenerUltimaMarca,
    finalizarSesion,
    eliminarSesion,
    obtenerHistorial,
    obtenerDetalleSesion
};