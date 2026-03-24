const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(403).json({ error: "Acceso denegado. No hay token de autenticación." });
    }

    try {
        const tokenLimpio = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
        const payload = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // ¡La magia está aquí! Sacamos el ID del usuario del interior del token
        req.usuario = payload.id_usuario || payload.id;
        
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido o caducado." });
    }
};