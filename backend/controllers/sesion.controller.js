const pool = require('../db');

// CU-08: Iniciar una nueva sesión de entrenamiento
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
            mensaje: "Sesión iniciada con éxito. ¡A darle duro!",
            sesion: nuevaSesion.rows[0]
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al iniciar la sesión");
    }
};

// CU-08 (Parte 2): Registrar una serie concreta dentro de la sesión activa
const registrarSerie = async (req, res) => {
    try {
        const { id_sesion } = req.params; // Lo sacaremos de la URL (ej: /api/sesiones/6/series)
        const { id_ejercicio, num_serie, peso_kg, repeticiones, rpe_fatiga } = req.body;

        // Validamos que nos manden los datos mínimos obligatorios
        if (!id_ejercicio || !num_serie || peso_kg == null || repeticiones == null) {
            return res.status(400).json({ error: "Faltan datos obligatorios para registrar la serie" });
        }

        // Insertamos la serie en la base de datos
        const nuevaSerie = await pool.query(
            `INSERT INTO registro_serie 
            (id_sesion, id_ejercicio, num_serie, peso_kg, repeticiones, rpe_fatiga) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [id_sesion, id_ejercicio, num_serie, peso_kg, repeticiones, rpe_fatiga || null]
        );

        res.status(201).json({
            mensaje: `Serie ${num_serie} registrada correctamente`,
            serie: nuevaSerie.rows
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al registrar la serie");
    }
};

// CU-10: Obtener la última marca de un ejercicio y generar sugerencia inteligente
const obtenerUltimaMarca = async (req, res) => {
    try {
        const { id_ejercicio } = req.params;
        const id_usuario = req.usuario;

        // Buscamos la última serie de este ejercicio que hizo este usuario específico
        const consulta = `
            SELECT rs.peso_kg, rs.repeticiones, rs.rpe_fatiga, se.fecha_inicio
            FROM registro_serie rs
            JOIN sesion_entrenamiento se ON rs.id_sesion = se.id_sesion
            WHERE rs.id_ejercicio = $1 AND se.id_usuario = $2
            ORDER BY se.fecha_inicio DESC, rs.num_serie DESC
            LIMIT 1;
        `;

        const resultado = await pool.query(consulta, [id_ejercicio, id_usuario]);

        // Si es la primera vez que hace el ejercicio, no hay historial
        if (resultado.rows.length === 0) {
            return res.json({ 
                mensaje: "Primera vez haciendo este ejercicio. ¡Encuentra tu peso base!",
                sugerencia: "Busca un peso con el que puedas hacer entre 8 y 12 repeticiones sintiendo un esfuerzo de 7-8/10."
            });
        }

        const ultimaMarca = resultado.rows[0];
        let sugerencia = "Mantén el peso e intenta sacar una repetición más."; // Sugerencia por defecto

        // LÓGICA DE SOBRECARGA PROGRESIVA BÁSICA
        // Si hizo muchas repeticiones y no le costó mucho (RPE <= 7 o 8), le pedimos que suba peso
        if (ultimaMarca.repeticiones >= 10 && ultimaMarca.rpe_fatiga <= 8) {
            sugerencia = `¡Vas sobrado! Sube el peso a ${parseFloat(ultimaMarca.peso_kg) + 2.5} kg.`;
        } else if (ultimaMarca.rpe_fatiga >= 9 && ultimaMarca.repeticiones < 8) {
            sugerencia = "La última vez te costó bastante. Mantén el peso o bájalo un poco si hoy no te sientes al 100%.";
        }

        res.json({
            ultima_marca: ultimaMarca,
            sugerencia_ia: sugerencia
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al calcular la sugerencia");
    }
};

// CU-08 (Parte 3): Finalizar la sesión de entrenamiento
const finalizarSesion = async (req, res) => {
    try {
        const { id_sesion } = req.params;

        // Actualizamos la sesión para ponerle la fecha de fin exacta (NOW())
        // Usamos req.usuario para asegurar que nadie cierra la sesión de otro
        const sesionFinalizada = await pool.query(
            "UPDATE sesion_entrenamiento SET fecha_fin = NOW() WHERE id_sesion = $1 AND id_usuario = $2 RETURNING *",
            [id_sesion, req.usuario]
        );

        if (sesionFinalizada.rows.length === 0) {
            return res.status(404).json({ error: "Sesión no encontrada o no autorizada" });
        }

        res.json({
            mensaje: "¡Entrenamiento finalizado! Buen trabajo, a descansar.",
            sesion: sesionFinalizada.rows[0]
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al finalizar la sesión");
    }
};

// CU-09: Consultar el historial de sesiones de entrenamiento del usuario
const obtenerHistorial = async (req, res) => {
    try {
        // Hacemos un LEFT JOIN por si en el futuro permites "Entrenamientos Libres" sin plantilla
       const consulta = `
            SELECT 
                s.id_sesion, 
                s.fecha_inicio, 
                s.fecha_fin, 
                s.notas, 
                e.nombre AS nombre_rutina,
                -- Magia SQL: Restamos fin menos inicio, lo pasamos a segundos (EPOCH) y dividimos entre 60 para tener minutos
                ROUND(EXTRACT(EPOCH FROM (s.fecha_fin - s.fecha_inicio)) / 60) AS duracion_minutos
            FROM sesion_entrenamiento s
            LEFT JOIN entrenamiento e ON s.id_entrenamiento = e.id_entrenamiento
            WHERE s.id_usuario = $1
            ORDER BY s.fecha_inicio DESC
        `;

        const historial = await pool.query(consulta, [req.usuario]);

        // Como queremos devolver una LISTA entera, enviamos todos los .rows
        res.json(historial.rows);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al obtener el historial");
    }
};

// CU-09 (Parte 2): Ver el detalle de todas las series de una sesión concreta
const obtenerDetalleSesion = async (req, res) => {
    try {
        const { id_sesion } = req.params;

        // Buscamos todas las series de esa sesión y las unimos con la tabla de ejercicios
        // para saber el nombre del ejercicio (ej: "Press de Banca")
        const consulta = `
            SELECT 
                rs.id_serie,
                rs.num_serie, 
                rs.peso_kg, 
                rs.repeticiones, 
                rs.rpe_fatiga, 
                e.nombre AS nombre_ejercicio,
                e.grupo_muscular
            FROM registro_serie rs
            JOIN ejercicio e ON rs.id_ejercicio = e.id_ejercicio
            WHERE rs.id_sesion = $1
            ORDER BY rs.id_ejercicio, rs.num_serie ASC
        `;
        
        const detalle = await pool.query(consulta, [id_sesion]);

        res.json(detalle.rows); // Devolvemos la lista de series

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error en el servidor al obtener el detalle de la sesión");
    }
};

module.exports = {
    iniciarSesion,
    registrarSerie,
    obtenerUltimaMarca,
    finalizarSesion,
    obtenerHistorial,
    obtenerDetalleSesion
};