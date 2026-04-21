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

  // ─── D-NEW-1: New proxy functions for MT5 Data Expansion ──────────

  /**
   * Fetch full account info (~40 fields) from MT5 via Python service
   * Endpoint: GET /account/full on Hoà's Flask
   */
  fetchAccountInfoFull: async () => {
    logger.info('Fetching full account info via Python service');
    try {
      const response = await axios.get(`${config.mt5.apiUrl}/account/full`, {
        headers: { 'X-API-Key': config.mt5.apiKey },
        timeout: 30000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch full account info',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return response.data.account || {};
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch full account info');
    }
  },

  /**
   * Fetch all symbols with market data
   * Endpoint: GET /symbols?group=... on Hoà's Flask
   */
  fetchSymbols: async (group = null) => {
    logger.info('Fetching symbols via Python service, group=%s', group);
    try {
      const params = group ? { group } : {};
      const response = await axios.get(`${config.mt5.apiUrl}/symbols`, {
        headers: { 'X-API-Key': config.mt5.apiKey },
        params,
        timeout: 30000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch symbols',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return { symbols: response.data.symbols || [], count: response.data.count || 0 };
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch symbols');
    }
  },

  /**
   * Fetch detail for a single symbol
   * Endpoint: GET /symbol/:name on Hoà's Flask
   */
  fetchSymbolDetail: async (symbolName) => {
    logger.info('Fetching symbol detail: %s', symbolName);
    try {
      const response = await axios.get(`${config.mt5.apiUrl}/symbol/${encodeURIComponent(symbolName)}`, {
        headers: { 'X-API-Key': config.mt5.apiKey },
        timeout: 15000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.NOT_FOUND, response.data.message || `Symbol ${symbolName} not found`,
          { code: response.data.errorCode || ErrorCodes.NOT_FOUND });
      }
      return response.data.symbol || {};
    } catch (error) {
      throw parseMt5Error(error, `Failed to fetch symbol ${symbolName}`);
    }
  },

  /**
   * Fetch currently active pending orders
   * Endpoint: GET /orders/pending on Hoà's Flask
   */
  fetchPendingOrders: async () => {
    logger.info('Fetching pending orders via Python service');
    try {
      const response = await axios.get(`${config.mt5.apiUrl}/orders/pending`, {
        headers: { 'X-API-Key': config.mt5.apiKey },
        timeout: 15000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch pending orders',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return { orders: response.data.orders || [], count: response.data.count || 0 };
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch pending orders');
    }
  },

  /**
   * Fetch historical orders
   * Endpoint: POST /orders/history on Hoà's Flask
   */
  fetchOrderHistory: async (fromDate, toDate) => {
    logger.info('Fetching order history: %s to %s', fromDate, toDate);
    try {
      const body = {};
      if (fromDate) body.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate;
      if (toDate) body.toDate = toDate instanceof Date ? toDate.toISOString() : toDate;

      const response = await axios.post(`${config.mt5.apiUrl}/orders/history`, body, {
        headers: { 'X-API-Key': config.mt5.apiKey, 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch order history',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return { orders: response.data.orders || [], count: response.data.count || 0 };
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch order history');
    }
  },

  /**
   * Fetch OHLC price history bars
   * Endpoint: POST /price-history on Hoà's Flask
   */
  fetchPriceHistory: async (symbol, timeframe = 'H1', fromDate = null, toDate = null, count = 500) => {
    logger.info('Fetching price history: %s %s count=%d', symbol, timeframe, count);
    try {
      const body = { symbol, timeframe, count };
      if (fromDate) body.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate;
      if (toDate) body.toDate = toDate instanceof Date ? toDate.toISOString() : toDate;

      const response = await axios.post(`${config.mt5.apiUrl}/price-history`, body, {
        headers: { 'X-API-Key': config.mt5.apiKey, 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch price history',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return { symbol: response.data.symbol, timeframe: response.data.timeframe, bars: response.data.bars || [], count: response.data.count || 0 };
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch price history');
    }
  },

  /**
   * Fetch tick-level data
   * Endpoint: POST /ticks on Hoà's Flask
   */
  fetchTickData: async (symbol, count = 1000) => {
    logger.info('Fetching tick data: %s count=%d', symbol, count);
    try {
      const response = await axios.post(`${config.mt5.apiUrl}/ticks`, { symbol, count }, {
        headers: { 'X-API-Key': config.mt5.apiKey, 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch tick data',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return { symbol: response.data.symbol, ticks: response.data.ticks || [], count: response.data.count || 0 };
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch tick data');
    }
  },

  /**
   * Fetch MT5 terminal info + latency
   * Endpoint: GET /terminal on Hoà's Flask
   */
  fetchTerminalInfo: async () => {
    logger.info('Fetching terminal info via Python service');
    try {
      const response = await axios.get(`${config.mt5.apiUrl}/terminal`, {
        headers: { 'X-API-Key': config.mt5.apiKey },
        timeout: 10000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch terminal info',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return response.data.terminal || {};
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch terminal info');
    }
  },

  /**
   * Fetch all performance metrics (Sharpe, PF, MDD, etc.)
   * Endpoint: POST /performance on Hoà's Flask
   */
  fetchPerformance: async (accountId, server, password, fromDate = null) => {
    logger.info('Fetching performance metrics for account: %s', accountId);
    try {
      const body = { accountId: parseInt(accountId, 10), server, password };
      if (fromDate) body.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate;

      const response = await axios.post(`${config.mt5.apiUrl}/performance`, body, {
        headers: { 'X-API-Key': config.mt5.apiKey, 'Content-Type': 'application/json' },
        timeout: 60000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to fetch performance',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return { performance: response.data.performance || {}, tradesAnalyzed: response.data.tradesAnalyzed || 0 };
    } catch (error) {
      throw parseMt5Error(error, 'Failed to fetch performance metrics');
    }
  },

  /**
   * Full sync v2 — everything: account, trades, positions, orders, performance, terminal
   * Endpoint: POST /full-sync-v2 on Hoà's Flask
   */
  fullSyncV2: async (accountId, server, password, fromDate = null) => {
    logger.info('Full sync v2 for account: %s', accountId);
    try {
      const body = { accountId: parseInt(accountId, 10), server, password };
      if (fromDate) body.fromDate = fromDate instanceof Date ? fromDate.toISOString() : fromDate;

      const response = await axios.post(`${config.mt5.apiUrl}/full-sync-v2`, body, {
        headers: { 'X-API-Key': config.mt5.apiKey, 'Content-Type': 'application/json' },
        timeout: 120000,
      });
      if (!response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, response.data.message || 'Failed to full sync v2',
          { code: response.data.errorCode || ErrorCodes.MT5_DATA_FETCH_FAILED });
      }
      return response.data;
    } catch (error) {
      throw parseMt5Error(error, 'Failed to full sync v2');
    }
  },
};
