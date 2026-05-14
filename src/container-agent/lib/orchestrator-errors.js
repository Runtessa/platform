const createHttpError = (status, message) => {
  const error = new Error(String(message || 'Request failed'));
  error.status = Number(status) || 500;
  return error;
};

const normalizeError = (error) => {
  if (!error) return { status: 500, message: 'Unknown error' };
  const status = Number(error.status || error.statusCode || 500);
  const message = String(error.message || error || 'Unknown error');
  return {
    status: Number.isFinite(status) ? status : 500,
    message,
  };
};

module.exports = {
  createHttpError,
  normalizeError,
};
