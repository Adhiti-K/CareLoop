const { sendError } = require('../utils/responseHandler');

function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err.stack || err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, message, status);
}

module.exports = {
  errorHandler
};
