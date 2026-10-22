const AppError = require('../utils/AppError');

// Role-based authorisation on the server (SRS SEC-02, SAD §4.3 role matrix).
// FR-05: forbidden requests get 403 and a message with no protected data.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this.'));
    }
    return next();
  };
}

module.exports = authorize;
