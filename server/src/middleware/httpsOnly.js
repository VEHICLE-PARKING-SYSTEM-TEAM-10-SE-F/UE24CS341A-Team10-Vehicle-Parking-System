// SEC-04: plain-HTTP requests are redirected to HTTPS (GET/HEAD) or refused (anything else,
// so a password or token is never accepted over an unencrypted connection).
function httpsOnly(req, res, next) {
  if (req.secure) return next();
  const host = req.get('host');
  if (host && (req.method === 'GET' || req.method === 'HEAD')) {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  return res.status(403).json({ error: { code: 'HTTPS_REQUIRED', message: 'Use HTTPS to connect to this service', field: null } });
}

module.exports = httpsOnly;
