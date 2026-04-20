class ApiError extends Error {
  /**
   * Create an API error.
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean|Object} options - If boolean: isOperational flag (backward compat).
   *   If object: { isOperational, reason, code, stack }
   * @param {string} [stack] - Error stack trace (used when options is boolean)
   *
   * @example
   * // Backward compatible (existing code):
   * throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
   * throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid input', false, err.stack);
   *
   * // With error code (new code):
   * throw new ApiError(httpStatus.NOT_FOUND, 'Account not found', { code: ErrorCodes.ACCOUNT_NOT_FOUND });
   * throw new ApiError(401, 'Invalid credentials', { code: ErrorCodes.MT5_INVALID_CREDENTIALS, reason: 'Wrong password' });
   */
  constructor(statusCode, message, options = {}, stack = '') {
    super(message);
    this.statusCode = statusCode;
    let resolvedOptions = {};

    if (typeof options === 'boolean') {
      resolvedOptions = { isOperational: options, stack };
    } else {
      resolvedOptions = options || {};
    }

    const { isOperational = true, reason, code, stack: optionsStack } = resolvedOptions;

    this.isOperational = isOperational;
    if (reason) {
      this.reason = reason;
    }
    if (code) {
      this.code = code;
    }

    const finalStack = typeof options === 'boolean' ? stack : optionsStack;

    if (finalStack) {
      this.stack = finalStack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
