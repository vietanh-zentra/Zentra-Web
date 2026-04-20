const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');
const {
  accountService,
  tradeService,
  syncService,
  openPositionService,
  dailySummaryService,
  mt5Service,
  userService,
} = require('../services');

/**
 * POST /v1/accounts
 * Register a new MT5 account for the authenticated user
 */
const createAccount = catchAsync(async (req, res) => {
  logger.info('[AccountController] Creating account for user: %s', req.user.id);
  const account = await accountService.createAccount(req.user.id, req.body);
  res.status(httpStatus.CREATED).send({
    success: true,
    account,
  });
});

/**
 * GET /v1/accounts
 * Get all MT5 accounts for the authenticated user
 */
const getAccounts = catchAsync(async (req, res) => {
  logger.info('[AccountController] Getting accounts for user: %s', req.user.id);
  const accounts = await accountService.getAccountsByUser(req.user.id);
  res.status(httpStatus.OK).send({
    success: true,
    accounts,
    total: accounts.length,
  });
});

/**
 * GET /v1/accounts/:accountId
 * Get a single account detail
 */
const getAccount = catchAsync(async (req, res) => {
  logger.info('[AccountController] Getting account: %s', req.params.accountId);
  const account = await accountService.getAccountById(req.params.accountId, req.user.id);
  res.status(httpStatus.OK).send({
    success: true,
    account,
  });
});

/**
 * DELETE /v1/accounts/:accountId
 * Delete an account and all related data
 */
const deleteAccount = catchAsync(async (req, res) => {
  logger.info('[AccountController] Deleting account: %s', req.params.accountId);
  const result = await accountService.deleteAccount(req.params.accountId, req.user.id);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Account and all related data deleted successfully',
    deleted: result,
  });
});

/**
 * POST /v1/accounts/:accountId/sync
 * Trigger a trade sync from MT5 for the specified account
 */
const triggerSync = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const { fromDate, toDate, syncType } = req.body;
  logger.info('[AccountController] Triggering sync for account: %s', accountId);

  // Verify account ownership
  const account = await accountService.getAccountById(accountId, req.user.id);

  // Create sync log
  const syncLog = await syncService.createSyncLog(account.id, syncType || 'full', { fromDate, toDate });
  const startTime = Date.now();

  try {
    // Get user's MT5 credentials
    const user = await userService.getUserById(req.user.id);
    if (!user.mt5Account || !user.mt5Account.isConnected) {
      throw new Error('MT5 account not connected. Please connect via /v1/mt5/connect first.');
    }

    const decryptedPassword = user.getMT5Password();
    const from = fromDate ? new Date(fromDate) : (account.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const to = toDate ? new Date(toDate) : new Date();

    // Fetch trades from MT5 Python service
    const mt5Trades = await mt5Service.fetchMT5Trades(
      account.accountId,
      user.mt5Account.server,
      decryptedPassword,
      from,
      to
    );

    // Bulk insert trades (skipping duplicates)
    const bulkResult = await tradeService.createBulkTradesForAccount(req.user.id, account.id, mt5Trades);

    // Recalculate daily summaries for affected dates
    if (bulkResult.inserted > 0) {
      await dailySummaryService.recalculateForTrades(account.id, bulkResult.trades);
    }

    // Update account info
    await accountService.updateAccountInfo(account.id, {
      lastSync: new Date(),
      totalTradesSynced: (account.totalTradesSynced || 0) + bulkResult.inserted,
    });

    // Mark sync as success
    await syncService.markSyncSuccess(syncLog.id, {
      tradesSynced: mt5Trades.length,
      newTradesInserted: bulkResult.inserted,
      connectionTimeMs: null,
      totalTimeMs: Date.now() - startTime,
    });

    logger.info('[AccountController] Sync completed: %d fetched, %d inserted, %d skipped',
      mt5Trades.length, bulkResult.inserted, bulkResult.skipped);

    res.status(httpStatus.OK).send({
      success: true,
      syncId: syncLog.id,
      tradesFetched: mt5Trades.length,
      tradesInserted: bulkResult.inserted,
      tradesSkipped: bulkResult.skipped,
      totalTimeMs: Date.now() - startTime,
      syncedAt: new Date(),
    });
  } catch (error) {
    // Mark sync as failed
    await syncService.markSyncFailed(syncLog.id, error.message, error.code || null);
    throw error;
  }
});

/**
 * GET /v1/accounts/:accountId/trades
 * Get trades for a specific account with filters and pagination
 */
const getTrades = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const { from, to, symbol, tradeType, sortBy, page, limit } = req.query;
  logger.info('[AccountController] Getting trades for account: %s', accountId);

  // Verify account ownership
  await accountService.getAccountById(accountId, req.user.id);

  const result = await tradeService.getTradesByAccount(
    accountId,
    { from, to, symbol, tradeType },
    { sortBy, page: parseInt(page, 10) || 1, limit: parseInt(limit, 10) || 50 }
  );

  res.status(httpStatus.OK).send({
    success: true,
    trades: result.results,
    total: result.totalResults,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

/**
 * GET /v1/accounts/:accountId/positions
 * Get open positions for a specific account
 */
const getPositions = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  logger.info('[AccountController] Getting positions for account: %s', accountId);

  // Verify account ownership
  await accountService.getAccountById(accountId, req.user.id);

  const positions = await openPositionService.getPositions(accountId);
  res.status(httpStatus.OK).send({
    success: true,
    positions,
    total: positions.length,
  });
});

/**
 * GET /v1/accounts/:accountId/summary
 * Get daily summaries for a specific account
 */
const getSummary = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const { from, to } = req.query;
  logger.info('[AccountController] Getting summary for account: %s', accountId);

  // Verify account ownership
  await accountService.getAccountById(accountId, req.user.id);

  const summaries = await dailySummaryService.getSummaries(accountId, from, to);
  res.status(httpStatus.OK).send({
    success: true,
    summaries,
    total: summaries.length,
  });
});

/**
 * GET /v1/accounts/:accountId/sync-logs
 * Get sync history for a specific account
 */
const getSyncLogs = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const { limit } = req.query;
  logger.info('[AccountController] Getting sync logs for account: %s', accountId);

  // Verify account ownership
  await accountService.getAccountById(accountId, req.user.id);

  const logs = await syncService.getSyncHistory(accountId, parseInt(limit, 10) || 20);
  res.status(httpStatus.OK).send({
    success: true,
    syncLogs: logs,
    total: logs.length,
  });
});

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
