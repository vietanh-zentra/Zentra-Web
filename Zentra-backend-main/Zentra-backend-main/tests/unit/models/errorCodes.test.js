const { ErrorCodes, ErrorHttpStatus } = require('../../../src/utils/errorCodes');

describe('Error Codes', () => {
  test('should have all required API error codes', () => {
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });

  test('should have all required Account error codes', () => {
    expect(ErrorCodes.ACCOUNT_NOT_FOUND).toBe('ACCOUNT_NOT_FOUND');
    expect(ErrorCodes.ACCOUNT_ALREADY_EXISTS).toBe('ACCOUNT_ALREADY_EXISTS');
    expect(ErrorCodes.ACCOUNT_DELETE_FAILED).toBe('ACCOUNT_DELETE_FAILED');
  });

  test('should have all required Trade error codes', () => {
    expect(ErrorCodes.TRADE_NOT_FOUND).toBe('TRADE_NOT_FOUND');
    expect(ErrorCodes.TRADE_DUPLICATE_TICKET).toBe('TRADE_DUPLICATE_TICKET');
    expect(ErrorCodes.TRADE_BULK_INSERT_FAILED).toBe('TRADE_BULK_INSERT_FAILED');
  });

  test('should have all required MT5 error codes', () => {
    expect(ErrorCodes.MT5_INVALID_CREDENTIALS).toBe('MT5_INVALID_CREDENTIALS');
    expect(ErrorCodes.MT5_SERVER_UNREACHABLE).toBe('MT5_SERVER_UNREACHABLE');
    expect(ErrorCodes.MT5_CONNECTION_TIMEOUT).toBe('MT5_CONNECTION_TIMEOUT');
    expect(ErrorCodes.MT5_NOT_INITIALIZED).toBe('MT5_NOT_INITIALIZED');
    expect(ErrorCodes.MT5_NO_TRADE_HISTORY).toBe('MT5_NO_TRADE_HISTORY');
    expect(ErrorCodes.MT5_PERMISSION_DENIED).toBe('MT5_PERMISSION_DENIED');
    expect(ErrorCodes.MT5_SERVICE_UNAVAILABLE).toBe('MT5_SERVICE_UNAVAILABLE');
  });

  test('should have HTTP status mapping for every error code', () => {
    Object.values(ErrorCodes).forEach((code) => {
      expect(ErrorHttpStatus[code]).toBeDefined();
      expect(typeof ErrorHttpStatus[code]).toBe('number');
      expect(ErrorHttpStatus[code]).toBeGreaterThanOrEqual(400);
      expect(ErrorHttpStatus[code]).toBeLessThanOrEqual(599);
    });
  });

  test('should map MT5 credential error to 401', () => {
    expect(ErrorHttpStatus[ErrorCodes.MT5_INVALID_CREDENTIALS]).toBe(401);
  });

  test('should map account not found to 404', () => {
    expect(ErrorHttpStatus[ErrorCodes.ACCOUNT_NOT_FOUND]).toBe(404);
  });

  test('should map duplicate account to 409', () => {
    expect(ErrorHttpStatus[ErrorCodes.ACCOUNT_ALREADY_EXISTS]).toBe(409);
  });

  test('should map service unavailable to 503', () => {
    expect(ErrorHttpStatus[ErrorCodes.MT5_SERVICE_UNAVAILABLE]).toBe(503);
  });
});
