export function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role ?? "guest";
    if (allowed.includes(role)) return next();
    return res.status(403).json({ error: "Forbidden" });
  };
}
