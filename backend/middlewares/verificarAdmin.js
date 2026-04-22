const pool = require('../db');

const verificarAdmin = async (req, res, next) => {
  try {
    const resultado = await pool.query(
      'SELECT es_admin FROM usuario WHERE id_usuario = $1',
      [req.usuario]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!resultado.rows[0].es_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    next();
  } catch (error) {
    console.error('Error al verificar admin:', error.message);
    res.status(500).json({ error: 'Error al verificar permisos de administrador' });
  }
};

module.exports = verificarAdmin;