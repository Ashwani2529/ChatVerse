// Express 4 does not forward rejected promises to the error handler, so every
// async handler and middleware gets wrapped in this.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
