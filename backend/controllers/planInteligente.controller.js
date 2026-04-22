const pool = require('../db');
const { generarPreviewPlanInteligente } = require('../services/planInteligente.generator');

const obtenerCatalogoParaPlan = async () => {
  const result = await pool.query(`
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
      equipamiento_tipo
    FROM ejercicio
    WHERE activo = true
    ORDER BY nombre ASC
  `);

  return result.rows;
};

const generarPreview = async (req, res) => {
  try {
    const catalogo = await obtenerCatalogoParaPlan();
    const preview = generarPreviewPlanInteligente(req.body, catalogo);
    res.json(preview);
  } catch (error) {
    console.error('Error al generar preview del plan inteligente:', error.message);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Error al generar la preview del plan inteligente'
    });
  }
};

const guardarPlan = async (req, res) => {
  const client = await pool.connect();

  try {
    const { meta, plan } = req.body;

    if (!meta || !plan || !Array.isArray(plan.dias) || plan.dias.length === 0) {
      return res.status(400).json({ error: 'La estructura del plan no es válida.' });
    }

    await client.query('BEGIN');

    const planInsert = await client.query(
      `INSERT INTO plan_inteligente (
          id_usuario,
          nombre,
          tipo_plan,
          objetivo,
          nivel,
          dias_semana,
          minutos_sesion,
          equipamiento,
          enfoque,
          incluye_core,
          incluye_cardio,
          preferencia
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id_plan_inteligente`,
      [
        req.usuario,
        plan.nombre,
        plan.tipo_plan,
        meta.objetivo,
        meta.nivel,
        meta.dias_semana || null,
        meta.minutos_sesion,
        meta.equipamiento,
        meta.enfoque || null,
        Boolean(meta.incluye_core),
        Boolean(meta.incluye_cardio),
        meta.preferencia || null
      ]
    );

    const idPlan = planInsert.rows[0].id_plan_inteligente;
    const rutinasGuardadas = [];

    for (const dia of plan.dias) {
      const insertEntrenamiento = await client.query(
        `INSERT INTO entrenamiento (
            id_usuario,
            nombre,
            objetivo,
            es_predeterminado,
            id_plan_inteligente,
            origen,
            nombre_dia,
            posicion_plan
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id_entrenamiento, nombre, nombre_dia, posicion_plan`,
        [
          req.usuario,
          dia.nombre_dia,
          meta.objetivo,
          false,
          idPlan,
          'inteligente',
          dia.nombre_dia,
          dia.posicion_plan || null
        ]
      );

      const entrenamiento = insertEntrenamiento.rows[0];

      let orden = 1;

      for (const ej of dia.ejercicios) {
        if (!ej.id_ejercicio) {
          throw new Error(`Ejercicio sin id en ${dia.nombre_dia}`);
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
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            entrenamiento.id_entrenamiento,
            ej.id_ejercicio,
            orden,
            ej.series ?? 3,
            ej.descanso ?? 60,
            ej.reps_objetivo_min ?? null,
            ej.reps_objetivo_max ?? null,
            ej.duracion_objetivo_segundos ?? null,
            ej.distancia_objetivo_metros ?? null
          ]
        );

        orden++;
      }

      rutinasGuardadas.push(entrenamiento);
    }

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Plan inteligente guardado correctamente',
      id_plan_inteligente: idPlan,
      rutinas: rutinasGuardadas
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar plan inteligente:', error.message);
    res.status(500).json({
      error: 'Error al guardar el plan inteligente',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

const obtenerPlanes = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
          p.id_plan_inteligente,
          p.nombre,
          p.tipo_plan,
          p.objetivo,
          p.nivel,
          p.dias_semana,
          p.minutos_sesion,
          p.equipamiento,
          p.enfoque,
          p.incluye_core,
          p.incluye_cardio,
          p.preferencia,
          p.fecha_creacion,
          COUNT(e.id_entrenamiento) AS total_rutinas
       FROM plan_inteligente p
       LEFT JOIN entrenamiento e
         ON e.id_plan_inteligente = p.id_plan_inteligente
       WHERE p.id_usuario = $1
       GROUP BY p.id_plan_inteligente
       ORDER BY p.fecha_creacion DESC`,
      [req.usuario]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener planes inteligentes:', error.message);
    res.status(500).json({ error: 'Error al obtener los planes inteligentes' });
  }
};

const obtenerPlanPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const planRes = await pool.query(
      `SELECT *
       FROM plan_inteligente
       WHERE id_plan_inteligente = $1
         AND id_usuario = $2`,
      [id, req.usuario]
    );

    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plan inteligente no encontrado' });
    }

    const plan = planRes.rows[0];

    const rutinasRes = await pool.query(
      `SELECT
          e.id_entrenamiento,
          e.nombre,
          e.nombre_dia,
          e.posicion_plan
       FROM entrenamiento e
       WHERE e.id_plan_inteligente = $1
         AND e.id_usuario = $2
       ORDER BY e.posicion_plan ASC, e.id_entrenamiento ASC`,
      [id, req.usuario]
    );

    const detalleRes = await pool.query(
      `SELECT
          e.id_entrenamiento,
          e.nombre_dia,
          e.posicion_plan,
          ej.id_ejercicio,
          ej.nombre AS nombre_ejercicio,
          ej.grupo_muscular,
          ej.imagen_url,
          ej.tipo_registro,
          ej.usa_peso,
          ej.usa_repeticiones,
          ej.usa_duracion,
          ej.usa_distancia,
          ee.orden,
          ee.series_objetivo,
          ee.tiempo_descanso_segundos,
          ee.reps_objetivo_min,
          ee.reps_objetivo_max,
          ee.duracion_objetivo_segundos,
          ee.distancia_objetivo_metros
       FROM entrenamiento e
       JOIN ejercicio_entrenamiento ee
         ON ee.id_entrenamiento = e.id_entrenamiento
       JOIN ejercicio ej
         ON ej.id_ejercicio = ee.id_ejercicio
       WHERE e.id_plan_inteligente = $1
         AND e.id_usuario = $2
       ORDER BY e.posicion_plan ASC, ee.orden ASC`,
      [id, req.usuario]
    );

    const dias = rutinasRes.rows.map(rutina => ({
      id_entrenamiento: rutina.id_entrenamiento,
      nombre_dia: rutina.nombre_dia,
      posicion_plan: rutina.posicion_plan,
      ejercicios: detalleRes.rows
        .filter(d => d.id_entrenamiento === rutina.id_entrenamiento)
        .map(d => ({
          id_ejercicio: d.id_ejercicio,
          nombre: d.nombre_ejercicio,
          grupo_muscular: d.grupo_muscular,
          imagen_url: d.imagen_url,
          tipo_registro: d.tipo_registro,
          usa_peso: d.usa_peso,
          usa_repeticiones: d.usa_repeticiones,
          usa_duracion: d.usa_duracion,
          usa_distancia: d.usa_distancia,
          orden: d.orden,
          series_objetivo: d.series_objetivo,
          tiempo_descanso_segundos: d.tiempo_descanso_segundos,
          reps_objetivo_min: d.reps_objetivo_min,
          reps_objetivo_max: d.reps_objetivo_max,
          duracion_objetivo_segundos: d.duracion_objetivo_segundos,
          distancia_objetivo_metros: d.distancia_objetivo_metros
        }))
    }));

    res.json({
      ...plan,
      dias
    });

  } catch (error) {
    console.error('Error al obtener detalle del plan inteligente:', error.message);
    res.status(500).json({ error: 'Error al obtener el detalle del plan inteligente' });
  }
};

const eliminarPlan = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const planRes = await client.query(
      `SELECT id_plan_inteligente
       FROM plan_inteligente
       WHERE id_plan_inteligente = $1
         AND id_usuario = $2`,
      [id, req.usuario]
    );

    if (planRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Plan inteligente no encontrado' });
    }

    const entrenamientosRes = await client.query(
      `SELECT id_entrenamiento
       FROM entrenamiento
       WHERE id_plan_inteligente = $1
         AND id_usuario = $2`,
      [id, req.usuario]
    );

    const idsEntrenamiento = entrenamientosRes.rows.map(r => r.id_entrenamiento);

    if (idsEntrenamiento.length > 0) {
      await client.query(
        `UPDATE sesion_entrenamiento
         SET id_entrenamiento = NULL
         WHERE id_entrenamiento = ANY($1::int[])
           AND id_usuario = $2`,
        [idsEntrenamiento, req.usuario]
      );

      await client.query(
        `DELETE FROM ejercicio_entrenamiento
         WHERE id_entrenamiento = ANY($1::int[])`,
        [idsEntrenamiento]
      );

      await client.query(
        `DELETE FROM entrenamiento
         WHERE id_entrenamiento = ANY($1::int[])
           AND id_usuario = $2`,
        [idsEntrenamiento, req.usuario]
      );
    }

    await client.query(
      `DELETE FROM plan_inteligente
       WHERE id_plan_inteligente = $1
         AND id_usuario = $2`,
      [id, req.usuario]
    );

    await client.query('COMMIT');

    res.json({ mensaje: 'Plan inteligente eliminado correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar plan inteligente:', error.message);
    res.status(500).json({ error: 'Error al eliminar el plan inteligente', detalle: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  generarPreview,
  guardarPlan,
  obtenerPlanes,
  obtenerPlanPorId,
  eliminarPlan
};