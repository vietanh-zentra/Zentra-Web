const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createAccount = {
  body: Joi.object().keys({
    accountId: Joi.string().required().trim().description('MT5 account number (login)'),
    brokerServer: Joi.string().required().trim().description('MT5 broker server name'),
    company: Joi.string().trim().optional().description('Broker company name'),
    accountName: Joi.string().trim().optional().description('Account holder name'),
    balance: Joi.number().optional().default(0),
    equity: Joi.number().optional().default(0),
    currency: Joi.string().trim().optional().default('USD'),
    leverage: Joi.number().integer().optional(),
    margin: Joi.number().optional().default(0),
  }),
};

const getAccounts = {
  query: Joi.object().keys({
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).optional(),
  }),
};

const getAccount = {
  params: Joi.object().keys({
    accountId: Joi.string().required().custom(objectId),
  }),
};

const deleteAccount = {
  params: Joi.object().keys({
    accountId: Joi.string().required().custom(objectId),
  }),
};

const triggerSync = {
  params: Joi.object().keys({
    accountId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    fromDate: Joi.date().iso().optional().description('Start date for sync (ISO 8601)'),
    toDate: Joi.date().iso().optional().description('End date for sync (ISO 8601)'),
    syncType: Joi.string().valid('full', 'incremental').optional().default('full'),
  }),
};

const getTrades = {
  params: Joi.object().keys({
    accountId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    from: Joi.date().iso().optional().description('Filter trades from this date'),
    to: Joi.date().iso().optional().description('Filter trades to this date'),
    symbol: Joi.string().trim().optional().description('Filter by trading symbol (e.g. EURUSD)'),
    tradeType: Joi.string().valid('BUY', 'SELL').optional().description('Filter by trade direction'),
    sortBy: Joi.string().optional().default('entryTime:desc'),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(50),
  }),
};

const getPositions = {
  params: Joi.object().keys({
    accountId: Joi.string().required().custom(objectId),
  }),
};

const getSummary = {
  params: Joi.object().keys({
    accountId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    from: Joi.date().iso().optional().description('Summary from this date'),
    to: Joi.date().iso().optional().description('Summary to this date'),
  }),
};

const getSyncLogs = {
  params: Joi.object().keys({
    accountId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

module.exports = {
  createAccount,
  getAccounts,
  getAccount,
  deleteAccount,
  triggerSync,
  getTrades,
  getPositions,
  getSummary,
  getSyncLogs,
};
