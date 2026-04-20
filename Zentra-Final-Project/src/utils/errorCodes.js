/**
 * Standardized Error Codes for Zentra Platform
 *
 * These codes are shared between:
 *   - Node.js Backend (Express) — used by Dũng
 *   - Python MT5 Connector (Flask) — used by Hoà
 *
 * IMPORTANT: When Hoà's Python service returns an error,
 * it MUST use one of the MT5_* codes below so the backend
 * can parse and forward the correct error to the frontend.
 *
 * Usage in Node.js:
 *   const { ErrorCodes } = require('../utils/errorCodes');
 *   throw new ApiError(httpStatus.NOT_FOUND, 'Account not found', { code: ErrorCodes.ACCOUNT_NOT_FOUND });
 *
 * Usage in Python Flask (Hoà):
 *   return jsonify({ "error": True, "code": "MT5_INVALID_CREDENTIALS", "message": "..." }), 401
 */

const ErrorCodes = {
  // ─── General API Errors ────────────────────────────────────────────
  VALIDATION_ERROR: 'VALIDATION_ERROR', // Request body/params failed Joi validation
  UNAUTHORIZED: 'UNAUTHORIZED', // Missing or invalid JWT token
  FORBIDDEN: 'FORBIDDEN', // User does not have permission
  NOT_FOUND: 'NOT_FOUND', // Generic resource not found
  INTERNAL_ERROR: 'INTERNAL_ERROR', // Unexpected server error
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED', // Too many requests

  // ─── Account Errors ────────────────────────────────────────────────
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND', // MT5 account record not found in DB
  ACCOUNT_ALREADY_EXISTS: 'ACCOUNT_ALREADY_EXISTS', // Duplicate accountId for same user
  ACCOUNT_DELETE_FAILED: 'ACCOUNT_DELETE_FAILED', // Failed to delete account and related data

  // ─── Trade Errors ──────────────────────────────────────────────────
  TRADE_NOT_FOUND: 'TRADE_NOT_FOUND', // Trade record not found
  TRADE_DUPLICATE_TICKET: 'TRADE_DUPLICATE_TICKET', // MT5 ticket already exists in DB
  TRADE_BULK_INSERT_FAILED: 'TRADE_BULK_INSERT_FAILED', // Bulk insert operation failed

  // ─── Sync Errors ───────────────────────────────────────────────────
  SYNC_IN_PROGRESS: 'SYNC_IN_PROGRESS', // Another sync is already running
  SYNC_FAILED: 'SYNC_FAILED', // Sync operation failed (generic)

  // ─── Database Errors ───────────────────────────────────────────────
  DATABASE_ERROR: 'DATABASE_ERROR', // Generic database operation failed
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED', // Cannot connect to MongoDB

  // ─── MT5 Errors (Hoà uses these in Python Flask) ───────────────────
  MT5_INVALID_CREDENTIALS: 'MT5_INVALID_CREDENTIALS', // Wrong accountId, password, or server
  MT5_SERVER_UNREACHABLE: 'MT5_SERVER_UNREACHABLE', // Cannot connect to broker server
  MT5_CONNECTION_TIMEOUT: 'MT5_CONNECTION_TIMEOUT', // Connection timed out (>10s)
  MT5_NOT_INITIALIZED: 'MT5_NOT_INITIALIZED', // MetaTrader5 library not initialized
  MT5_NO_TRADE_HISTORY: 'MT5_NO_TRADE_HISTORY', // Account has no closed trades in date range
  MT5_PERMISSION_DENIED: 'MT5_PERMISSION_DENIED', // Investor password doesn't have read access
  MT5_TERMINAL_NOT_FOUND: 'MT5_TERMINAL_NOT_FOUND', // terminal64.exe not found at configured path
  MT5_ACCOUNT_MISMATCH: 'MT5_ACCOUNT_MISMATCH', // Connected account differs from requested
  MT5_DATA_FETCH_FAILED: 'MT5_DATA_FETCH_FAILED', // Failed to fetch deals/orders/positions from MT5
  MT5_SERVICE_UNAVAILABLE: 'MT5_SERVICE_UNAVAILABLE', // Python Flask MT5 service is down/unreachable
};

/**
 * HTTP status code mapping for each error code.
 * Used by error middleware to determine the correct HTTP response status.
 */
const ErrorHttpStatus = {
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,

  [ErrorCodes.ACCOUNT_NOT_FOUND]: 404,
  [ErrorCodes.ACCOUNT_ALREADY_EXISTS]: 409,
  [ErrorCodes.ACCOUNT_DELETE_FAILED]: 500,

  [ErrorCodes.TRADE_NOT_FOUND]: 404,
  [ErrorCodes.TRADE_DUPLICATE_TICKET]: 409,
  [ErrorCodes.TRADE_BULK_INSERT_FAILED]: 500,

  [ErrorCodes.SYNC_IN_PROGRESS]: 409,
  [ErrorCodes.SYNC_FAILED]: 500,

  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.DATABASE_CONNECTION_FAILED]: 503,

  [ErrorCodes.MT5_INVALID_CREDENTIALS]: 401,
  [ErrorCodes.MT5_SERVER_UNREACHABLE]: 502,
  [ErrorCodes.MT5_CONNECTION_TIMEOUT]: 504,
  [ErrorCodes.MT5_NOT_INITIALIZED]: 500,
  [ErrorCodes.MT5_NO_TRADE_HISTORY]: 404,
  [ErrorCodes.MT5_PERMISSION_DENIED]: 403,
  [ErrorCodes.MT5_TERMINAL_NOT_FOUND]: 500,
  [ErrorCodes.MT5_ACCOUNT_MISMATCH]: 409,
  [ErrorCodes.MT5_DATA_FETCH_FAILED]: 502,
  [ErrorCodes.MT5_SERVICE_UNAVAILABLE]: 503,
};

module.exports = {
  ErrorCodes,
  ErrorHttpStatus,
};
