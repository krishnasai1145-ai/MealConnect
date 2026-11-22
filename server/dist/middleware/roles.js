export function getAuthUser(res) {
    return res.locals.user;
}
export function requireRole(...allowed) {
    return (_req, res, next) => {
        const user = getAuthUser(res);
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!allowed.includes(user.role)) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        next();
    };
}
