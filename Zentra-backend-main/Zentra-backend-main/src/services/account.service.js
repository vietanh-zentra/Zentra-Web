const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { ErrorCodes } = require('../utils/errorCodes');
const logger = require('../config/logger');
const { Account, Trade, OpenPosition, DailySummary, SyncLog } = require('../models');

/**
 * Create a new MT5 account for a user
 * @param {ObjectId} userId
 * @param {Object} accountData - { accountId, brokerServer, company, accountName, balance, equity, currency, leverage, margin }
 * @returns {Promise<Account>}
 */
const createAccount = async (userId, accountData) => {
  logger.info('[AccountService] Creating account for user: %s, accountId: %s', userId, accountData.accountId);

  // Check for duplicate (same user + same MT5 account number)
  const existing = await Account.findOne({ userId, accountId: accountData.accountId });
  if (existing) {
    logger.info('[AccountService] Account already exists: %s', accountData.accountId);
    throw new ApiError(httpStatus.CONFLICT, `MT5 account ${accountData.accountId} is already registered`, {
      code: ErrorCodes.ACCOUNT_ALREADY_EXISTS,
    });
  }

  const account = new Account({
    userId,
    ...accountData,
  });
  await account.save();

  logger.info('[AccountService] Account created successfully: %s (id: %s)', account.accountId, account.id);
  return account;
};

/**
 * Get all accounts belonging to a user
 * @param {ObjectId} userId
 * @returns {Promise<Array<Account>>}
 */
const getAccountsByUser = async (userId) => {
  logger.info('[AccountService] Getting accounts for user: %s', userId);
  const accounts = await Account.find({ userId }).sort({ createdAt: -1 }).lean();
  logger.info('[AccountService] Found %d accounts', accounts.length);
  return accounts;
};

/**
 * Get a single account by its MongoDB _id
 * @param {ObjectId} accountId - MongoDB document _id
 * @param {ObjectId} userId - Owner user ID (for authorization check)
 * @returns {Promise<Account>}
 */
const getAccountById = async (accountId, userId) => {
  logger.info('[AccountService] Getting account: %s for user: %s', accountId, userId);
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Account not found', {
      code: ErrorCodes.ACCOUNT_NOT_FOUND,
    });
  }
  return account;
};

/**
 * Get account by MT5 account number (login)
 * @param {string} mt5AccountId - MT5 account number
 * @param {ObjectId} userId
 * @returns {Promise<Account|null>}
 */
const getAccountByMt5Id = async (mt5AccountId, userId) => {
  logger.info('[AccountService] Looking up account by MT5 ID: %s', mt5AccountId);
  return Account.findOne({ accountId: mt5AccountId, userId });
};

/**
 * Update account info (balance, equity, etc.) — typically called after sync
 * @param {ObjectId} accountId - MongoDB document _id
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Account>}
 */
const updateAccountInfo = async (accountId, updateData) => {
  logger.info('[AccountService] Updating account info: %s', accountId);
  const account = await Account.findById(accountId);
  if (!account) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Account not found', {
      code: ErrorCodes.ACCOUNT_NOT_FOUND,
    });
  }

  Object.assign(account, updateData);
  await account.save();

  logger.info('[AccountService] Account updated: %s (balance: %s, equity: %s)', account.accountId, account.balance, account.equity);
  return account;
};

/**
 * Mark account as connected/disconnected
 * @param {ObjectId} accountId
 * @param {boolean} isConnected
 * @returns {Promise<Account>}
 */
const setConnectionStatus = async (accountId, isConnected) => {
  logger.info('[AccountService] Setting connection status for %s: %s', accountId, isConnected);
  return Account.findByIdAndUpdate(accountId, { isConnected }, { new: true });
};

/**
 * Delete an account and ALL related data (trades, positions, summaries, sync logs)
 * @param {ObjectId} accountId - MongoDB document _id
 * @param {ObjectId} userId - Owner user ID (for authorization check)
 * @returns {Promise<Object>} - Deletion counts
 */
const deleteAccount = async (accountId, userId) => {
  logger.info('[AccountService] Deleting account: %s for user: %s', accountId, userId);

  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Account not found', {
      code: ErrorCodes.ACCOUNT_NOT_FOUND,
    });
  }

  // Delete all related data in parallel
  const [tradesResult, positionsResult, summariesResult, logsResult] = await Promise.all([
    Trade.deleteMany({ accountId }),
    OpenPosition.deleteMany({ accountId }),
    DailySummary.deleteMany({ accountId }),
    SyncLog.deleteMany({ accountId }),
  ]);

  // Delete the account itself
  await account.remove();

  const result = {
    account: 1,
    trades: tradesResult.deletedCount,
    positions: positionsResult.deletedCount,
    summaries: summariesResult.deletedCount,
    syncLogs: logsResult.deletedCount,
  };

  logger.info('[AccountService] Account deleted with related data: %j', result);
  return result;
};

module.exports = {
  createAccount,
  getAccountsByUser,
  getAccountById,
  getAccountByMt5Id,
  updateAccountInfo,
  setConnectionStatus,
  deleteAccount,
};
