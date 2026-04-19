const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    // Preserve error code if it exists on the original error (e.g. from MT5 service response)
    const code = error.code || undefined;
    error = new ApiError(statusCode, message, { isOperational: false, code, stack: err.stack });
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    ...(err.code && { errorCode: err.code }),
    ...(err.reason && { reason: err.reason }),
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error('Error: %s Code: %s Stack: %s', err.message, err.code || 'N/A', err.stack);
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};

