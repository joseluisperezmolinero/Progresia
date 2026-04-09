const pool = require('../db');

const toNullableNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
};

const crearEntrenamiento = async (req, res) => {
    const client = await pool.connect();

    try {
        const { nombre, ejercicios } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la rutina es obligatorio' });
        }

        if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
            return res.status(400).json({ error: 'Debes añadir al menos un ejercicio' });
        }

        await client.query('BEGIN');

        const resEntrenamiento = await client.query(
            `INSERT INTO entrenamiento 
                (id_usuario, nombre, objetivo, es_predeterminado) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id_entrenamiento`,
            [req.usuario, nombre.trim(), 'Personalizado', false]
        );

        const idEntrenamiento = resEntrenamiento.rows[0].id_entrenamiento;

        if (!idEntrenamiento) {
            throw new Error('No se pudo obtener el id_entrenamiento');
        }

        let orden = 1;

        for (const ej of ejercicios) {
            if (!ej.id_ejercicio) {
                throw new Error(`Ejercicio inválido en la posición ${orden}`);
            }

            await client.query(
                `INSERT INTO ejercicio_entrenamiento (
                    id_entrenamiento,
                    id_ejercicio,
                    orden,
                    series_objetivo,
                    tiempo_descanso_segundos,
                    reps_objetivo_min,
                    reps_objetivo_max,
                    duracion_objetivo_segundos,
                    distancia_objetivo_metros
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    idEntrenamiento,
                    ej.id_ejercicio,
                    orden,
                    toNullableNumber(ej.series) ?? 3,
                    toNullableNumber(ej.descanso) ?? 90,
                    toNullableNumber(ej.reps_objetivo_min),
                    toNullableNumber(ej.reps_objetivo_max),
                    toNullableNumber(ej.duracion_objetivo_segundos),
                    toNullableNumber(ej.distancia_objetivo_metros)
                ]
            );

            orden++;
        }

        await client.query('COMMIT');

        res.status(201).json({
            mensaje: 'Entrenamiento creado con éxito',
            id_entrenamiento: idEntrenamiento
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear la rutina:', error.message);
        res.status(500).json({
            error: 'Error en el servidor al crear el entrenamiento',
            detalle: error.message
        });
    } finally {
        client.release();
    }
};

const obtenerEntrenamientos = async (req, res) => {
    try {
        const entrenamientos = await pool.query(
            `SELECT * 
             FROM entrenamiento 
             WHERE id_usuario = $1 OR es_predeterminado = true 
             ORDER BY id_entrenamiento DESC`,
            [req.usuario]
        );

        res.json(entrenamientos.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor al obtener los entrenamientos');
    }
};

const obtenerEntrenamientoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const consulta = `
            SELECT 
                e.id_entrenamiento,
                e.nombre AS nombre_rutina,
                e.objetivo,
                e.es_predeterminado,

                ej.id_ejercicio,
                ej.nombre AS nombre_ejercicio,
                ej.grupo_muscular,
                ej.imagen_url,
                ej.tipo_ejercicio,
                ej.tipo_registro,
                ej.usa_peso,
                ej.usa_repeticiones,
                ej.usa_duracion,
                ej.usa_distancia,
                ej.series_default,
                ej.descanso_default_segundos,
                ej.reps_min_default,
                ej.reps_max_default,
                ej.duracion_default_segundos,
                ej.distancia_default_metros,

                ee.orden,
                ee.series_objetivo,
                ee.tiempo_descanso_segundos,
                ee.reps_objetivo_min,
                ee.reps_objetivo_max,
                ee.duracion_objetivo_segundos,
                ee.distancia_objetivo_metros
            FROM entrenamiento e
            LEFT JOIN ejercicio_entrenamiento ee 
                ON e.id_entrenamiento = ee.id_entrenamiento
            LEFT JOIN ejercicio ej 
                ON ee.id_ejercicio = ej.id_ejercicio
            WHERE e.id_entrenamiento = $1
              AND (e.id_usuario = $2 OR e.es_predeterminado = true)
            ORDER BY ee.orden ASC
        `;

        const resultado = await pool.query(consulta, [id, req.usuario]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Entrenamiento no encontrado' });
        }

        const primeraFila = resultado.rows[0];

        const entrenamientoCompleto = {
            id_entrenamiento: primeraFila.id_entrenamiento,
            nombre: primeraFila.nombre_rutina,
            objetivo: primeraFila.objetivo,
            es_predeterminado: primeraFila.es_predeterminado,
            ejercicios: primeraFila.id_ejercicio
                ? resultado.rows.map(fila => ({
                    id_ejercicio: fila.id_ejercicio,
                    nombre: fila.nombre_ejercicio,
                    grupo_muscular: fila.grupo_muscular,
                    imagen_url: fila.imagen_url,
                    tipo_ejercicio: fila.tipo_ejercicio,
                    tipo_registro: fila.tipo_registro,
                    usa_peso: fila.usa_peso,
                    usa_repeticiones: fila.usa_repeticiones,
                    usa_duracion: fila.usa_duracion,
                    usa_distancia: fila.usa_distancia,
                    orden: fila.orden,
                    series_objetivo: fila.series_objetivo,
                    tiempo_descanso_segundos: fila.tiempo_descanso_segundos,
                    reps_objetivo_min: fila.reps_objetivo_min,
                    reps_objetivo_max: fila.reps_objetivo_max,
                    duracion_objetivo_segundos: fila.duracion_objetivo_segundos,
                    distancia_objetivo_metros: fila.distancia_objetivo_metros
                }))
                : []
        };

        res.json(entrenamientoCompleto);

    } catch (error) {
        console.error('Error al obtener el detalle del entrenamiento:', error.message);
        res.status(500).json({
            error: 'Error al obtener el detalle del entrenamiento',
            detalle: error.message
        });
    }
};

const eliminarEntrenamiento = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const check = await client.query(
            `SELECT id_entrenamiento, nombre
             FROM entrenamiento
             WHERE id_entrenamiento = $1
               AND id_usuario = $2
               AND es_predeterminado = false`,
            [id, req.usuario]
        );

        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Rutina no encontrada o no autorizada'
            });
        }

        await client.query(
            `UPDATE sesion_entrenamiento
             SET id_entrenamiento = NULL
             WHERE id_entrenamiento = $1
               AND id_usuario = $2`,
            [id, req.usuario]
        );

        await client.query(
            `DELETE FROM ejercicio_entrenamiento
             WHERE id_entrenamiento = $1`,
            [id]
        );

        const borrado = await client.query(
            `DELETE FROM entrenamiento
             WHERE id_entrenamiento = $1
               AND id_usuario = $2
               AND es_predeterminado = false
             RETURNING id_entrenamiento, nombre`,
            [id, req.usuario]
        );

        if (borrado.rows.length === 0) {
            throw new Error('No se pudo eliminar la rutina');
        }

        await client.query('COMMIT');

        res.json({
            mensaje: 'Rutina eliminada correctamente',
            rutina: borrado.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar la rutina:', error.message);

        res.status(500).json({
            error: 'Error al eliminar la rutina',
            detalle: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    crearEntrenamiento,
    obtenerEntrenamientos,
    obtenerEntrenamientoPorId,
    eliminarEntrenamiento
};