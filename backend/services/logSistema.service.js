const pool = require('../db');

const TIPOS_VALIDOS = ['INFO', 'WARNING', 'ERROR'];

const normalizarTipo = (tipo = 'INFO') => {
  const t = String(tipo || 'INFO').toUpperCase().trim();
  return TIPOS_VALIDOS.includes(t) ? t : 'INFO';
};

const registrarLog = async ({ id_usuario = null, tipo_evento = 'INFO', detalle }) => {
  if (!detalle || !String(detalle).trim()) return;

  try {
    await pool.query(
      `INSERT INTO log_sistema (id_usuario, tipo_evento, detalle, fecha_hora)
       VALUES ($1, $2, $3, NOW())`,
      [id_usuario, normalizarTipo(tipo_evento), String(detalle).trim()]
    );
  } catch (error) {
    console.error('Error al registrar log del sistema:', error.message);
  }
};

module.exports = { registrarLog };