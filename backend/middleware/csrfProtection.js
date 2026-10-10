// Cookie authentication needs CSRF protection because browsers attach cookies automatically.
// Check Origin on every state-changing request (POST/PUT/PATCH/DELETE).
const allowedOrigins = new Set(
  (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.get('origin');
  // Requests without Origin are typically non-browser clients (e.g. health checks / scripts).
  // Browser requests with an Origin must match the configured frontend origin exactly.
  if (origin && allowedOrigins.has(origin.replace(/\/$/, ''))) return next();
  if (!origin && process.env.ALLOW_ORIGINLESS_API_REQUESTS === 'true') return next();

  return res.status(403).json({ success: false, message: 'Request origin rejected.' });
}

module.exports = csrfProtection;
