const axios = require('axios');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { ErrorCodes, ErrorHttpStatus } = require('../utils/errorCodes');
const logger = require('../config/logger');
const config = require('../config/config');

/**
 * Parse error from Python MT5 Flask service response.
 * Hoà's Python service returns: { success: false, errorCode: "MT5_...", message: "..." }
 * We must extract errorCode and map it to the correct HTTP status.
 *
 * @param {Object} error - Axios error object
 * @param {string} fallbackMessage - Default message if none found
 * @returns {ApiError}
 */
const parseMt5Error = (error, fallbackMessage) => {
  if (error instanceof ApiError) return error;

  const responseData = error.response?.data || {};
  const errorCode = responseData.errorCode || responseData.code || null;
  const message = responseData.message || responseData.error || error.message || fallbackMessage;

  // If we got an errorCode from Hoà's Python service, use the mapped HTTP status
  let statusCode = error.response?.status || httpStatus.INTERNAL_SERVER_ERROR;
  if (errorCode && ErrorHttpStatus[errorCode]) {
    statusCode = ErrorHttpStatus[errorCode];
  }

  return new ApiError(statusCode, message, { code: errorCode || ErrorCodes.MT5_SERVICE_UNAVAILABLE });
};

/**
 * Connect to MT5 account via Python service
 * @param {string} accountId
 * @param {string} server
 * @param {string} password
 * @param {boolean} manualLogin - If true, sends manualLogin: true (required for first-time connections)
 * @returns {Promise<Object>}
 */
const connectMT5Account = async (accountId, server, password, manualLogin = false) => {
  logger.info(
    'Connecting to MT5 account via Python service: %s on server: %s, manualLogin: %s',
    accountId,
    server,
    manualLogin
  );

  try {
    const requestBody = {
      accountId: parseInt(accountId, 10),
      server,
      password,
    };

    // Include manualLogin: true only for first-time connections
    if (manualLogin) {
      requestBody.manualLogin = true;
      logger.info('Including manualLogin: true for first-time MT5 connection');
    }

    const response = await axios.post(`${config.mt5.apiUrl}/connect`, requestBody, {
      headers: {
        'X-API-Key': config.mt5.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 90000, // 90 seconds timeout
    });

    if (!response.data.success) {
      logger.error('MT5 connection failed: %s', response.data.message || response.data.error);
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        response.data.message || response.data.error || 'Failed to connect to MT5 account',
        { code: response.data.errorCode || ErrorCodes.MT5_INVALID_CREDENTIALS }
      );
    }

    logger.info('MT5 account connected successfully: %s', accountId);
    return response.data;
  } catch (error) {
    logger.error('MT5 connection error: %s (code: %s)', error.message, error.code || 'N/A');
    throw parseMt5Error(error, 'Failed to connect to MT5 account');
  }
};

/**
 * Fetch account info from MT5 via Python service
 * Hoà's Python service returns: { success: true, accountInfo: { balance, equity, currency, leverage, ... } }
 *
 * @param {string} accountId - MT5 login number
 * @param {string} server - Broker server
 * @param {string} password - Decrypted password
 * @returns {Promise<Object>} - { balance, equity, currency, leverage, margin, company, accountName }
 */
const fetchAccountInfo = async (accountId, server, password) => {
  logger.info('Fetching MT5 account info via Python service: %s', accountId);

  try {
    const response = await axios.post(
      `${config.mt5.apiUrl}/account-info`,
      {
        accountId: parseInt(accountId, 10),
        server,
        password,
      },
      {
        headers: {
          'X-API-Key': config.mt5.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (!response.data.success) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        response.data.message || 'Failed to fetch account info',
        { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED }
      );
    }

    logger.info('Fetched account info for: %s (balance: %s)', accountId, response.data.accountInfo?.balance);
    return response.data.accountInfo || {};
  } catch (error) {
    logger.error('MT5 fetch account info error: %s', error.message);
    throw parseMt5Error(error, 'Failed to fetch account info from MT5');
  }
};

/**
 * Fetch trades from MT5 account via Python service
 * @param {string} accountId
 * @param {string} server
 * @param {string} password
 * @param {Date} fromDate
 * @param {Date} toDate
 * @returns {Promise<Array>}
 */
const fetchMT5Trades = async (accountId, server, password, fromDate, toDate) => {
  logger.info('Fetching MT5 trades via Python service: %s from %s to %s', accountId, fromDate, toDate);

  try {
    const response = await axios.post(
      `${config.mt5.apiUrl}/trades`,
      {
        accountId: parseInt(accountId, 10),
        server,
        password,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      {
        headers: {
          'X-API-Key': config.mt5.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds timeout for trade fetching
      }
    );

    if (!response.data.success) {
      logger.error('MT5 fetch trades failed: %s', response.data.message || response.data.error);
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        response.data.message || response.data.error || 'Failed to fetch trades from MT5',
        { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED }
      );
    }

    logger.info('Fetched %d trades from MT5', response.data.count || 0);
    return response.data.trades || [];
  } catch (error) {
    logger.error('MT5 fetch trades error: %s (code: %s)', error.message, error.code || 'N/A');
    throw parseMt5Error(error, 'Failed to fetch trades from MT5');
  }
};

/**
 * Fetch open positions from MT5 account via Python service
 * Hoà's Python service returns: { success: true, positions: [...] }
 *
 * @param {string} accountId - MT5 login number
 * @param {string} server - Broker server
 * @param {string} password - Decrypted password
 * @returns {Promise<Array>} - Array of position objects
 */
const fetchOpenPositions = async (accountId, server, password) => {
  logger.info('Fetching MT5 open positions via Python service: %s', accountId);

  try {
    const response = await axios.post(
      `${config.mt5.apiUrl}/positions`,
      {
        accountId: parseInt(accountId, 10),
        server,
        password,
      },
      {
        headers: {
          'X-API-Key': config.mt5.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (!response.data.success) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        response.data.message || 'Failed to fetch open positions',
        { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED }
      );
    }

    logger.info('Fetched %d open positions from MT5', response.data.positions?.length || 0);
    return response.data.positions || [];
  } catch (error) {
    logger.error('MT5 fetch positions error: %s', error.message);
    throw parseMt5Error(error, 'Failed to fetch open positions from MT5');
  }
};

module.exports = {
  connectMT5Account,
  fetchAccountInfo,
  fetchMT5Trades,
  fetchOpenPositions,
};

