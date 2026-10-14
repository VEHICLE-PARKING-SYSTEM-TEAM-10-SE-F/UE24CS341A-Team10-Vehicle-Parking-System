// Typed application error. Services throw these; the error handler turns them
// into the standard error body of SAD §4.4.
class AppError extends Error {
  constructor(status, code, message, field = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

module.exports = AppError;
