export const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            res.status(401).json({ error: 'Unauthorized. Please log in.' });
        } else {
            res.redirect('/index.html');
        }
    }
};
