const pool = require('../db');

// CU-05: Crear un nuevo entrenamiento con sus ejercicios
const crearEntrenamiento = async (req, res) => {
    // 1. Pedimos un "cliente" a la base de datos exclusivo para esta transacción
    const client = await pool.connect();

    try {
        const { nombre, objetivo, ejercicios } = req.body;
        
        // Iniciamos la transacción (O todo, o nada)
        await client.query('BEGIN');

        // 2. Insertamos la cabecera del entrenamiento (El "sobre")
        const resEntrenamiento = await client.query(
            "INSERT INTO entrenamiento (id_usuario, nombre, objetivo) VALUES ($1, $2, $3) RETURNING id_entrenamiento",
            [req.usuario, nombre, objetivo] // req.usuario viene del token gracias al 'auth'
        );
        const idEntrenamiento = resEntrenamiento.rows[0].id_entrenamiento;        // 3. Recorremos la lista de ejercicios que nos manda el usuario y los metemos uno a uno
        let orden = 1;
        for (let ej of ejercicios) {
            await client.query(
                "INSERT INTO ejercicio_entrenamiento (id_entrenamiento, id_ejercicio, orden, series_objetivo, tiempo_descanso_segundos) VALUES ($1, $2, $3, $4, $5)",
                [idEntrenamiento, ej.id_ejercicio, orden, ej.series_objetivo, ej.tiempo_descanso_segundos || 90]
            );
            orden++; // Para que el siguiente ejercicio sea el número 2, 3, etc.
        }

        // 4. Si todo ha ido bien, guardamos los cambios definitivamente
        await client.query('COMMIT');
        res.status(201).json({ 
            mensaje: "Entrenamiento creado con éxito", 
            id_entrenamiento: idEntrenamiento 
        });

    } catch (error) {
        // Si hay CUALQUIER error, deshacemos todo para no dejar datos a medias
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send("Error en el servidor al crear el entrenamiento");
    } finally {
        // Devolvemos el "cliente" a la piscina para que lo use otra persona
        client.release();
    }
};

// CU-06: Obtener todos los entrenamientos (del usuario y los de la app)
const obtenerEntrenamientos = async (req, res) => {
    try {
        const entrenamientos = await pool.query(
            "SELECT * FROM entrenamiento WHERE id_usuario = $1 OR es_predeterminado = true ORDER BY id_entrenamiento DESC",
            [req.usuario] // req.usuario viene del token
        );
        
        // ¡OJO AQUÍ! Como queremos devolver una LISTA de entrenamientos, 
        // aquí SÍ usamos solo .rows (sin el). ¡Queremos la caja de huevos entera!
        res.json(entrenamientos.rows); 
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al obtener los entrenamientos");
    }
};

// CU-06: Obtener un entrenamiento específico con todos sus ejercicios
const obtenerEntrenamientoPorId = async (req, res) => {
    try {
        const { id } = req.params; // Sacamos el ID de la URL (ej: /api/entrenamientos/2)

        // Hacemos la súper consulta uniendo las 3 tablas (JOIN)
        const consulta = `
            SELECT 
                e.id_entrenamiento, e.nombre AS nombre_rutina, e.objetivo, e.es_predeterminado,
                ej.id_ejercicio, ej.nombre AS nombre_ejercicio, ej.grupo_muscular, ej.imagen_url,
                ee.orden, ee.series_objetivo, ee.tiempo_descanso_segundos
            FROM entrenamiento e
            JOIN ejercicio_entrenamiento ee ON e.id_entrenamiento = ee.id_entrenamiento
            JOIN ejercicio ej ON ee.id_ejercicio = ej.id_ejercicio
            WHERE e.id_entrenamiento = $1 AND (e.id_usuario = $2 OR e.es_predeterminado = true)
            ORDER BY ee.orden ASC
        `;

        const resultado = await pool.query(consulta, [id, req.usuario]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Entrenamiento no encontrado o no tienes permiso para verlo" });
        }

    
       // Formateamos la respuesta para que el Frontend la entienda a la perfección
        const entrenamientoCompleto = {
            id_entrenamiento: resultado.rows.id_entrenamiento,
            nombre: resultado.rows.nombre_rutina,
            objetivo: resultado.rows.objetivo,
            es_predeterminado: resultado.rows.es_predeterminado,
        
            // Usamos .map para meter todos los ejercicios dentro de una lista
            ejercicios: resultado.rows.map(fila => ({
                id_ejercicio: fila.id_ejercicio,
                nombre: fila.nombre_ejercicio,
                grupo_muscular: fila.grupo_muscular,
                imagen_url: fila.imagen_url,
                orden: fila.orden,
                series_objetivo: fila.series_objetivo,
                tiempo_descanso_segundos: fila.tiempo_descanso_segundos
            }))
        };

        res.json(entrenamientoCompleto);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al obtener el detalle del entrenamiento");
    }
};

module.exports = {
    crearEntrenamiento,
    obtenerEntrenamientos,
    obtenerEntrenamientoPorId
};