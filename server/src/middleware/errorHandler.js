module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  console.error(`[${status}] ${req.method} ${req.path}:`, err.message);
  res.status(status).json({ error: err.message || 'Internal server error' });
};
