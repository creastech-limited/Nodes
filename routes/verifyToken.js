const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req, res, next) {
    const authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Authorization header missing or invalid format');
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = verified;
        next();
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        res.status(400).json({ message: 'Invalid token.' });
    }
};
