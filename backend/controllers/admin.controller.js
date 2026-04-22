const pool = require('../db');
const { registrarLog } = require('../services/logSistema.service');

const toNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  return Boolean(value);
};

const camposEjercicioSelect = `
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
`;

const defaultsPorTipoRegistro = (tipoRegistro) => {
  switch (tipoRegistro) {
    case 'peso_reps':
      return {
        usa_peso: true,
        usa_repeticiones: true,
        usa_duracion: false,
        usa_distancia: false
      };
    case 'reps':
      return {
        usa_peso: false,
        usa_repeticiones: true,
        usa_duracion: false,
        usa_distancia: false
      };
    case 'duracion':
      return {
        usa_peso: false,
        usa_repeticiones: false,
        usa_duracion: true,
        usa_distancia: false
      };
    case 'distancia_duracion':
      return {
        usa_peso: false,
        usa_repeticiones: false,
        usa_duracion: true,
        usa_distancia: true
      };
    default:
      return {
        usa_peso: false,
        usa_repeticiones: true,
        usa_duracion: false,
        usa_distancia: false
      };
  }
};

const normalizarPayloadEjercicio = (body, actual = {}) => {
  const tipo_registro = body.tipo_registro ?? actual.tipo_registro ?? 'peso_reps';
  const flags = defaultsPorTipoRegistro(tipo_registro);

  return {
    nombre: String(body.nombre ?? actual.nombre ?? '').trim(),
    grupo_muscular: String(body.grupo_muscular ?? actual.grupo_muscular ?? '').trim(),
    imagen_url:
      body.imagen_url !== undefined
        ? (String(body.imagen_url || '').trim() || null)
        : (actual.imagen_url ?? null),
    tipo_ejercicio: String(body.tipo_ejercicio ?? actual.tipo_ejercicio ?? 'fuerza').trim(),
    tipo_registro,
    usa_peso: toBoolean(body.usa_peso, flags.usa_peso),
    usa_repeticiones: toBoolean(body.usa_repeticiones, flags.usa_repeticiones),
    usa_duracion: toBoolean(body.usa_duracion, flags.usa_duracion),
    usa_distancia: toBoolean(body.usa_distancia, flags.usa_distancia),
    series_default: toNullableNumber(body.series_default ?? actual.series_default ?? 3),
    descanso_default_segundos: toNullableNumber(
      body.descanso_default_segundos ?? actual.descanso_default_segundos ?? 60
    ),
    reps_min_default: toNullableNumber(body.reps_min_default ?? actual.reps_min_default ?? null),
    reps_max_default: toNullableNumber(body.reps_max_default ?? actual.reps_max_default ?? null),
    duracion_default_segundos: toNullableNumber(
      body.duracion_default_segundos ?? actual.duracion_default_segundos ?? null
    ),
    distancia_default_metros: toNullableNumber(
      body.distancia_default_metros ?? actual.distancia_default_metros ?? null
    ),
    activo: toBoolean(body.activo, actual.activo ?? true),
    demo_url:
      body.demo_url !== undefined
        ? (String(body.demo_url || '').trim() || null)
        : (actual.demo_url ?? null),
    equipamiento_tipo: String(
      body.equipamiento_tipo ?? actual.equipamiento_tipo ?? 'gimnasio_completo'
    ).trim()
  };
};

const obtenerResumenSistema = async (req, res) => {
  try {
    const totalUsuariosRes = await pool.query(
      'SELECT COUNT(*)::int AS total FROM usuario'
    );

    const totalAdminsRes = await pool.query(
      'SELECT COUNT(*)::int AS total FROM usuario WHERE es_admin = true'
    );

    const totalSesionesRes = await pool.query(
      'SELECT COUNT(*)::int AS total FROM sesion_entrenamiento'
    );

    const sesionesCompletadasRes = await pool.query(
      'SELECT COUNT(*)::int AS total FROM sesion_entrenamiento WHERE fecha_fin IS NOT NULL'
    );

    const incidenciasAbiertasRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM incidencia_tecnica
       WHERE LOWER(estado) IN ('abierta', 'en progreso')`
    );

    const logsRes = await pool.query(
      'SELECT COUNT(*)::int AS total FROM log_sistema'
    );

    res.json({
      total_usuarios: totalUsuariosRes.rows[0].total,
      total_admins: totalAdminsRes.rows[0].total,
      total_sesiones: totalSesionesRes.rows[0].total,
      sesiones_completadas: sesionesCompletadasRes.rows[0].total,
      incidencias_abiertas: incidenciasAbiertasRes.rows[0].total,
      total_logs: logsRes.rows[0].total
    });
  } catch (error) {
    console.error('Error al obtener resumen del sistema:', error.message);

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al obtener resumen del sistema: ${error.message}`
    });

    res.status(500).json({ error: 'Error al obtener el resumen del sistema' });
  }
};

const obtenerLogsSistema = async (req, res) => {
  try {
    const { tipo_evento, limit = 100 } = req.query;

    let consulta = `
      SELECT
        l.id_log,
        l.id_usuario,
        u.nombre,
        u.apellidos,
        l.tipo_evento,
        l.detalle,
        l.fecha_hora
      FROM log_sistema l
      LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
    `;
    const valores = [];

    if (tipo_evento) {
      consulta += ' WHERE l.tipo_evento = $1 ';
      valores.push(String(tipo_evento).toUpperCase().trim());
    }

    const limiteSeguro = Math.max(1, Math.min(500, Number(limit) || 100));
    consulta += ` ORDER BY l.fecha_hora DESC LIMIT $${valores.length + 1}`;
    valores.push(limiteSeguro);

    const resultado = await pool.query(consulta, valores);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener logs:', error.message);
    res.status(500).json({ error: 'Error al obtener los logs del sistema' });
  }
};

const obtenerIncidencias = async (req, res) => {
  try {
    const { estado } = req.query;

    let consulta = `
      SELECT
        i.id_incidencia,
        i.id_usuario,
        u.nombre,
        u.apellidos,
        i.titulo,
        i.descripcion,
        i.estado,
        i.prioridad,
        i.categoria,
        i.notas_seguimiento,
        i.fecha_reporte,
        i.fecha_actualizacion
      FROM incidencia_tecnica i
      LEFT JOIN usuario u ON u.id_usuario = i.id_usuario
    `;
    const valores = [];

    if (estado) {
      consulta += ' WHERE i.estado = $1 ';
      valores.push(estado);
    }

    consulta += ' ORDER BY i.fecha_actualizacion DESC, i.fecha_reporte DESC';

    const resultado = await pool.query(consulta, valores);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener incidencias:', error.message);
    res.status(500).json({ error: 'Error al obtener incidencias' });
  }
};

const crearIncidencia = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      prioridad = 'media',
      categoria = 'general',
      notas_seguimiento = null
    } = req.body;

    if (!titulo || !String(titulo).trim() || !descripcion || !String(descripcion).trim()) {
      return res.status(400).json({ error: 'Título y descripción son obligatorios' });
    }

    const resultado = await pool.query(
      `INSERT INTO incidencia_tecnica
        (id_usuario, titulo, descripcion, estado, prioridad, categoria, notas_seguimiento, fecha_reporte, fecha_actualizacion)
       VALUES ($1, $2, $3, 'Abierta', $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        req.usuario,
        String(titulo).trim(),
        String(descripcion).trim(),
        prioridad,
        categoria,
        notas_seguimiento
      ]
    );

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'INFO',
      detalle: `Incidencia creada por admin. Título: ${String(titulo).trim()}`
    });

    res.status(201).json({
      mensaje: 'Incidencia registrada correctamente',
      incidencia: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al crear incidencia:', error.message);

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al crear incidencia: ${error.message}`
    });

    res.status(500).json({ error: 'Error al registrar la incidencia' });
  }
};

const actualizarIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas_seguimiento } = req.body;

    const estadosValidos = ['Abierta', 'En progreso', 'Resuelta', 'Cerrada'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const resultado = await pool.query(
      `UPDATE incidencia_tecnica
       SET estado = COALESCE($1, estado),
           notas_seguimiento = COALESCE($2, notas_seguimiento),
           fecha_actualizacion = NOW()
       WHERE id_incidencia = $3
       RETURNING *`,
      [estado ?? null, notas_seguimiento ?? null, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'INFO',
      detalle: `Incidencia #${id} actualizada por admin. Nuevo estado: ${estado || 'sin cambio de estado'}`
    });

    res.json({
      mensaje: 'Incidencia actualizada correctamente',
      incidencia: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar incidencia:', error.message);

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al actualizar incidencia #${req.params.id}: ${error.message}`
    });

    res.status(500).json({ error: 'Error al actualizar la incidencia' });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
          id_usuario,
          nombre,
          apellidos,
          email,
          fecha_registro,
          es_admin
       FROM usuario
       ORDER BY id_usuario ASC`
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

const actualizarRolAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { es_admin } = req.body;

    if (typeof es_admin !== 'boolean') {
      return res.status(400).json({ error: 'El campo es_admin debe ser booleano' });
    }

    const usuarioObjetivo = await pool.query(
      `SELECT id_usuario, nombre, apellidos, email, es_admin
       FROM usuario
       WHERE id_usuario = $1`,
      [id]
    );

    if (usuarioObjetivo.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarioObjetivo.rows[0];

    if (Number(id) === Number(req.usuario) && es_admin === false) {
      return res.status(400).json({
        error: 'No puedes quitarte a ti mismo el rol de administrador'
      });
    }

    if (usuario.es_admin === true && es_admin === false) {
      const totalAdmins = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM usuario
         WHERE es_admin = true`
      );

      if (totalAdmins.rows[0].total <= 1) {
        return res.status(400).json({
          error: 'Debe existir al menos un administrador en el sistema'
        });
      }
    }

    const actualizado = await pool.query(
      `UPDATE usuario
       SET es_admin = $1
       WHERE id_usuario = $2
       RETURNING id_usuario, nombre, apellidos, email, fecha_registro, es_admin`,
      [es_admin, id]
    );

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'INFO',
      detalle: `Rol admin actualizado para usuario #${id} (${actualizado.rows[0].email}). Nuevo valor: ${es_admin}`
    });

    res.json({
      mensaje: 'Rol de administrador actualizado correctamente',
      usuario: actualizado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar rol admin:', error.message);

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al actualizar rol admin del usuario #${req.params.id}: ${error.message}`
    });

    res.status(500).json({ error: 'Error al actualizar el rol del usuario' });
  }
};

const actualizarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellidos, email } = req.body;

    const usuarioRes = await pool.query(
      `SELECT id_usuario, nombre, apellidos, email, fecha_registro, es_admin
       FROM usuario
       WHERE id_usuario = $1`,
      [id]
    );

    if (usuarioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const actual = usuarioRes.rows[0];

    const nombreFinal = nombre !== undefined ? String(nombre).trim() : actual.nombre;
    const apellidosFinal = apellidos !== undefined ? String(apellidos).trim() : (actual.apellidos || '');
    const emailFinal = email !== undefined ? String(email).trim().toLowerCase() : actual.email;

    if (!nombreFinal) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }

    if (!emailFinal) {
      return res.status(400).json({ error: 'El email no puede estar vacío' });
    }

    const actualizado = await pool.query(
      `UPDATE usuario
       SET nombre = $1,
           apellidos = $2,
           email = $3
       WHERE id_usuario = $4
       RETURNING id_usuario, nombre, apellidos, email, fecha_registro, es_admin`,
      [nombreFinal, apellidosFinal, emailFinal, id]
    );

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'INFO',
      detalle: `Usuario #${id} actualizado por admin. Nuevo email: ${emailFinal}`
    });

    res.json({
      mensaje: 'Usuario actualizado correctamente',
      usuario: actualizado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error.message);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ese correo ya está en uso por otro usuario' });
    }

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al actualizar usuario #${req.params.id}: ${error.message}`
    });

    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

const eliminarUsuarioAdmin = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (Number(id) === Number(req.usuario)) {
      return res.status(400).json({
        error: 'No puedes eliminar tu propia cuenta desde el panel de administración'
      });
    }

    await client.query('BEGIN');

    const usuarioRes = await client.query(
      `SELECT id_usuario, nombre, apellidos, email, es_admin
       FROM usuario
       WHERE id_usuario = $1`,
      [id]
    );

    if (usuarioRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarioRes.rows[0];

    if (usuario.es_admin) {
      const totalAdmins = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM usuario
         WHERE es_admin = true`
      );

      if (totalAdmins.rows[0].total <= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'No puedes eliminar al último administrador del sistema'
        });
      }
    }

    const entrenamientosRes = await client.query(
      `SELECT id_entrenamiento
       FROM entrenamiento
       WHERE id_usuario = $1`,
      [id]
    );

    const idsEntrenamiento = entrenamientosRes.rows.map((r) => r.id_entrenamiento);

    if (idsEntrenamiento.length > 0) {
      await client.query(
        `UPDATE sesion_entrenamiento
         SET id_entrenamiento = NULL
         WHERE id_entrenamiento = ANY($1::int[])`,
        [idsEntrenamiento]
      );

      await client.query(
        `DELETE FROM ejercicio_entrenamiento
         WHERE id_entrenamiento = ANY($1::int[])`,
        [idsEntrenamiento]
      );
    }

    await client.query(
      `DELETE FROM registro_serie
       WHERE id_sesion IN (
         SELECT id_sesion
         FROM sesion_entrenamiento
         WHERE id_usuario = $1
       )`,
      [id]
    );

    await client.query(
      `DELETE FROM sesion_entrenamiento
       WHERE id_usuario = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM entrenamiento
       WHERE id_usuario = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM incidencia_tecnica
       WHERE id_usuario = $1`,
      [id]
    );

    await client.query(
      `UPDATE log_sistema
       SET id_usuario = NULL
       WHERE id_usuario = $1`,
      [id]
    );

    const borrado = await client.query(
      `DELETE FROM usuario
       WHERE id_usuario = $1
       RETURNING id_usuario, nombre, apellidos, email`,
      [id]
    );

    await client.query('COMMIT');

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'WARNING',
      detalle: `Usuario eliminado por admin: #${id} (${usuario.email})`
    });

    res.json({
      mensaje: 'Usuario eliminado correctamente',
      usuario: borrado.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar usuario:', error.message);

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al eliminar usuario #${req.params.id}: ${error.message}`
    });

    res.status(500).json({ error: 'Error al eliminar el usuario' });
  } finally {
    client.release();
  }
};

const obtenerEjerciciosAdmin = async (req, res) => {
  try {
    const { activo } = req.query;

    let consulta = `
      SELECT ${camposEjercicioSelect}
      FROM ejercicio
    `;
    const valores = [];

    if (activo === 'true' || activo === 'false') {
      consulta += ' WHERE activo = $1 ';
      valores.push(activo === 'true');
    }

    consulta += ' ORDER BY activo DESC, nombre ASC';

    const resultado = await pool.query(consulta, valores);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener ejercicios admin:', error.message);

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al obtener ejercicios admin: ${error.message}`
    });

    res.status(500).json({ error: 'Error al obtener ejercicios' });
  }
};

const crearEjercicioAdmin = async (req, res) => {
  try {
    const payload = normalizarPayloadEjercicio(req.body);

    if (!payload.nombre || !payload.grupo_muscular) {
      return res.status(400).json({ error: 'Nombre y grupo muscular son obligatorios' });
    }

    const resultado = await pool.query(
      `INSERT INTO ejercicio (
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
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING ${camposEjercicioSelect}`,
      [
        payload.nombre,
        payload.grupo_muscular,
        payload.imagen_url,
        payload.tipo_ejercicio,
        payload.tipo_registro,
        payload.usa_peso,
        payload.usa_repeticiones,
        payload.usa_duracion,
        payload.usa_distancia,
        payload.series_default,
        payload.descanso_default_segundos,
        payload.reps_min_default,
        payload.reps_max_default,
        payload.duracion_default_segundos,
        payload.distancia_default_metros,
        payload.activo,
        payload.demo_url,
        payload.equipamiento_tipo
      ]
    );

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'INFO',
      detalle: `Ejercicio global creado por admin: ${payload.nombre}`
    });

    res.status(201).json({
      mensaje: 'Ejercicio creado correctamente',
      ejercicio: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al crear ejercicio admin:', error.message);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ese ejercicio ya existe en el catálogo' });
    }

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al crear ejercicio global: ${error.message}`
    });

    res.status(500).json({ error: 'Error al crear el ejercicio' });
  }
};

const actualizarEjercicioAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const actualRes = await pool.query(
      `SELECT ${camposEjercicioSelect}
       FROM ejercicio
       WHERE id_ejercicio = $1`,
      [id]
    );

    if (actualRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    const actual = actualRes.rows[0];
    const payload = normalizarPayloadEjercicio(req.body, actual);

    if (!payload.nombre || !payload.grupo_muscular) {
      return res.status(400).json({ error: 'Nombre y grupo muscular son obligatorios' });
    }

    const resultado = await pool.query(
      `UPDATE ejercicio
       SET nombre = $1,
           grupo_muscular = $2,
           imagen_url = $3,
           tipo_ejercicio = $4,
           tipo_registro = $5,
           usa_peso = $6,
           usa_repeticiones = $7,
           usa_duracion = $8,
           usa_distancia = $9,
           series_default = $10,
           descanso_default_segundos = $11,
           reps_min_default = $12,
           reps_max_default = $13,
           duracion_default_segundos = $14,
           distancia_default_metros = $15,
           activo = $16,
           demo_url = $17,
           equipamiento_tipo = $18
       WHERE id_ejercicio = $19
       RETURNING ${camposEjercicioSelect}`,
      [
        payload.nombre,
        payload.grupo_muscular,
        payload.imagen_url,
        payload.tipo_ejercicio,
        payload.tipo_registro,
        payload.usa_peso,
        payload.usa_repeticiones,
        payload.usa_duracion,
        payload.usa_distancia,
        payload.series_default,
        payload.descanso_default_segundos,
        payload.reps_min_default,
        payload.reps_max_default,
        payload.duracion_default_segundos,
        payload.distancia_default_metros,
        payload.activo,
        payload.demo_url,
        payload.equipamiento_tipo,
        id
      ]
    );

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'INFO',
      detalle: `Ejercicio global actualizado por admin: #${id} (${payload.nombre})`
    });

    res.json({
      mensaje: 'Ejercicio actualizado correctamente',
      ejercicio: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar ejercicio admin:', error.message);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe otro ejercicio con ese nombre' });
    }

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al actualizar ejercicio #${req.params.id}: ${error.message}`
    });

    res.status(500).json({ error: 'Error al actualizar el ejercicio' });
  }
};

const cambiarActivoEjercicioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El campo activo debe ser booleano' });
    }

    const resultado = await pool.query(
      `UPDATE ejercicio
       SET activo = $1
       WHERE id_ejercicio = $2
       RETURNING ${camposEjercicioSelect}`,
      [activo, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'INFO',
      detalle: `Ejercicio #${id} marcado como ${activo ? 'activo' : 'inactivo'}`
    });

    res.json({
      mensaje: `Ejercicio ${activo ? 'activado' : 'desactivado'} correctamente`,
      ejercicio: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al cambiar activo de ejercicio:', error.message);

    await registrarLog({
      id_usuario: req.usuario,
      tipo_evento: 'ERROR',
      detalle: `Error al cambiar activo del ejercicio #${req.params.id}: ${error.message}`
    });

    res.status(500).json({ error: 'Error al actualizar el estado del ejercicio' });
  }
};

module.exports = {
  obtenerResumenSistema,
  obtenerLogsSistema,
  obtenerIncidencias,
  crearIncidencia,
  actualizarIncidencia,
  obtenerUsuarios,
  actualizarRolAdmin,
  actualizarUsuarioAdmin,
  eliminarUsuarioAdmin,
  obtenerEjerciciosAdmin,
  crearEjercicioAdmin,
  actualizarEjercicioAdmin,
  cambiarActivoEjercicioAdmin
};