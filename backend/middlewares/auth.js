const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // 1. Buscamos el token en la cabecera (header) de la petición
    const token = req.header('Authorization');

    // 2. Si no hay token, no le dejamos pasar
    if (!token) {
        return res.status(403).json({ error: "Acceso denegado. No hay token de autenticación." });
    }

    try {
        // 3. Verificamos si el token es válido y no ha sido falsificado ni ha caducado
        // Ojo: normalmente el token viene con el formato "Bearer <token>"
        const tokenLimpio = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
        
        const payload = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // 4. Si es válido, extraemos el ID del usuario y lo guardamos para usarlo en la ruta
        req.usuario = payload.id_usuario;
        
        // 5. Le decimos que pase a la ruta que quería acceder
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido o caducado." });
    }
};