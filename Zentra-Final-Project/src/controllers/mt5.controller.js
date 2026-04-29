const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { mt5Service, userService, tradeService } = require('../services');
const { Trade, Account, BehaviorHeatmapHistory, StabilityTrendHistory } = require('../models');
const logger = require('../config/logger');

/**
 * Find or create an Account record for the given user's MT5 account.
 * Returns the Mongoose document so we can use account._id.
 */
const findOrCreateAccount = async (userId, mt5AccountId, brokerServer) => {
  let account = await Account.findOne({ userId, accountId: mt5AccountId });
  if (!account) {
    account = new Account({
      userId,
      accountId: mt5AccountId,
      brokerServer: brokerServer || 'unknown',
      isConnected: true,
    });
    await account.save();
    logger.info('Created new Account record: %s (id: %s)', mt5AccountId, account._id);
  }
  return account;
};

/**
 * Connect user's MT5 account
 */
const connectMT5 = catchAsync(async (req, res) => {
  logger.info('Connecting MT5 account for user: %s', req.user.id);
  const { accountId, server, password } = req.body;

  const user = await userService.getUserById(req.user.id);

  // Block if already connected to a different account
  if (user.mt5Account && user.mt5Account.isConnected && user.mt5Account.accountId !== accountId) {
    logger.info(
      'User %s already has MT5 account %s connected, blocking new connection to %s',
      req.user.id,
      user.mt5Account.accountId,
      accountId
    );
    throw new ApiError(
      httpStatus.CONFLICT,
      'MT5 account already connected. Disconnect current account before connecting a new one.'
    );
  }

  // Check if this is first time connection (same account reconnect or new connection)
  const isFirstTime = !user.mt5Account || !user.mt5Account.isConnected || !user.mt5Account.accountId;

  logger.info('MT5 connection for user %s - isFirstTime: %s', req.user.id, isFirstTime);

  // Connect via Python service
  const connectionResult = await mt5Service.connectMT5Account(accountId, server, password, isFirstTime);

  // Update user with MT5 credentials
  await userService.updateUserById(req.user.id, {
    mt5Account: {
      accountId,
      server,
      password,
      isConnected: true,
    },
  });

  logger.info('MT5 account connected and saved for user: %s', req.user.id);
  res.status(httpStatus.OK).send({
    success: true,
    accountId: connectionResult.accountId,
    server: connectionResult.server,
    balance: connectionResult.balance,
    equity: connectionResult.equity,
    margin: connectionResult.margin,
    currency: connectionResult.currency,
  });
});

/**
 * Sync trades from MT5 account
 */
const syncTrades = catchAsync(async (req, res) => {
  logger.info('Syncing MT5 trades for user: %s', req.user.id);
  const user = await userService.getUserById(req.user.id);

  if (!user.mt5Account || !user.mt5Account.isConnected) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MT5 account not connected');
  }

  // Find or create Account record to get the MongoDB ObjectId
  const account = await findOrCreateAccount(req.user.id, user.mt5Account.accountId, user.mt5Account.server);

  // Clean up any corrupt trades (accountId: null) from previous buggy syncs
  const cleanupResult = await Trade.deleteMany({ userId: req.user.id, accountId: null });
  if (cleanupResult.deletedCount > 0) {
    logger.info('Cleaned up %d corrupt trades (accountId: null) for user: %s', cleanupResult.deletedCount, req.user.id);
  }

  const { fromDate } = req.body;
  const from = user.mt5Account.lastSyncAt
    ? new Date(user.mt5Account.lastSyncAt)
    : new Date(fromDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = new Date(Date.now());
  logger.info('Syncing trades from %s to %s (current time)', from.toISOString(), to.toISOString());

  const decryptedPassword = user.getMT5Password();
  if (!decryptedPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MT5 password not found');
  }

  // Fetch trades from Python service
  const mt5Trades = await mt5Service.fetchMT5Trades(
    user.mt5Account.accountId,
    user.mt5Account.server,
    decryptedPassword,
    from,
    to
  );

  logger.info('Fetched %d trades from MT5, importing to database', mt5Trades.length);

  // Transform trades — include accountId (ObjectId) for unique index
  const transformedTrades = mt5Trades.map((trade) => ({
    accountId: account._id,
    entryTime: new Date(trade.entryTime),
    exitTime: new Date(trade.exitTime),
    riskPercentUsed: trade.riskPercentUsed,
    profitLoss: trade.profitLoss,
    riskRewardAchieved: trade.riskRewardAchieved,
    session: trade.session,
    stopLossHit: trade.stopLossHit,
    exitedEarly: trade.exitedEarly,
    targetPercentAchieved: trade.targetPercentAchieved,
    notes: trade.notes,
    mt5DealId: trade.mt5DealId,
    mt5Symbol: trade.mt5Symbol,
    ticket: trade.ticket,
    orderId: trade.orderId,
    dealInId: trade.dealInId,
    dealOutId: trade.dealOutId,
    positionId: trade.positionId,
    tradeType: trade.tradeType,
    volume: trade.volume,
    openPrice: trade.openPrice,
    closePrice: trade.closePrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    commission: trade.commission,
    swap: trade.swap,
    netProfit: trade.netProfit,
    magicNumber: trade.magicNumber,
    durationSeconds: trade.durationSeconds,
    source: {
      type: 'mt5',
      mt5AccountId: user.mt5Account.accountId,
    },
  }));

  // Bulk insert — skips duplicates gracefully
  const savedTrades = await tradeService.createBulkTrades(req.user.id, transformedTrades);

  // Update last sync time
  await userService.updateUserById(req.user.id, {
    'mt5Account.lastSyncAt': new Date(),
  });

  logger.info('Successfully synced %d trades for user: %s', savedTrades.length, req.user.id);
  res.status(httpStatus.OK).send({
    success: true,
    trades: savedTrades,
    count: savedTrades.length,
    syncedAt: new Date(),
  });
});

/**
 * Get MT5 connection status
 */
const getConnectionStatus = catchAsync(async (req, res) => {
  logger.info('Getting MT5 connection status for user: %s', req.user.id);
  const user = await userService.getUserById(req.user.id);

  if (!user.mt5Account || !user.mt5Account.isConnected) {
    return res.status(httpStatus.OK).send({
      connected: false,
      message: 'MT5 account not connected',
    });
  }

  res.status(httpStatus.OK).send({
    connected: true,
    accountId: user.mt5Account.accountId,
    server: user.mt5Account.server,
    lastSyncAt: user.mt5Account.lastSyncAt,
  });
});

/**
 * Disconnect MT5 account
 */
const disconnectMT5 = catchAsync(async (req, res) => {
  logger.info('Disconnecting MT5 account for user: %s', req.user.id);

  const user = await userService.getUserById(req.user.id);
  const mt5AccountId = user.mt5Account?.accountId;

  if (mt5AccountId) {
    // Delete all trades associated with this MT5 account
    const deleteTradesResult = await Trade.deleteMany({
      userId: req.user.id,
      'source.mt5AccountId': mt5AccountId,
    });
    logger.info(
      'Deleted %d MT5 trades for user: %s account: %s',
      deleteTradesResult.deletedCount,
      req.user.id,
      mt5AccountId
    );

    // Delete all heatmap history for this user
    const deleteHeatmapResult = await BehaviorHeatmapHistory.deleteMany({ userId: req.user.id });
    logger.info('Deleted %d heatmap history records for user: %s', deleteHeatmapResult.deletedCount, req.user.id);

    // Delete all stability history for this user
    const deleteStabilityResult = await StabilityTrendHistory.deleteMany({ userId: req.user.id });
    logger.info('Deleted %d stability history records for user: %s', deleteStabilityResult.deletedCount, req.user.id);
  }

  // Clear MT5 account info
  await userService.updateUserById(req.user.id, {
    mt5Account: {
      accountId: null,
      server: null,
      password: null,
      isConnected: false,
      lastSyncAt: null,
    },
  });

  logger.info('MT5 account disconnected for user: %s', req.user.id);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'MT5 account disconnected',
    deletedTrades: !!mt5AccountId,
  });
});

/**
 * Helper: get user credentials and verify MT5 connected
 */
const getMT5Credentials = async (userId) => {
  const user = await userService.getUserById(userId);
  if (!user.mt5Account || !user.mt5Account.isConnected) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MT5 account not connected');
  }
  const decryptedPassword = user.getMT5Password();
  if (!decryptedPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MT5 password not found');
  }
  return { user, decryptedPassword };
};

// ─── D-NEW-2: MT5 Data Expansion Controllers ────────────────────────

/**
 * GET /v1/mt5/account/full — Full account info (~40 fields)
 */
const getAccountFull = catchAsync(async (req, res) => {
  logger.info('Getting full account info for user: %s', req.user.id);
  await getMT5Credentials(req.user.id); // verify connected

  const account = await mt5Service.fetchAccountInfoFull();
  res.status(httpStatus.OK).send({ success: true, account });
});

/**
 * GET /v1/mt5/symbols — List all symbols with market data
 */
const getSymbols = catchAsync(async (req, res) => {
  logger.info('Getting symbols for user: %s', req.user.id);
  await getMT5Credentials(req.user.id);

  const { group } = req.query;
  const result = await mt5Service.fetchSymbols(group || null);
  res.status(httpStatus.OK).send({ success: true, ...result });
});

/**
 * GET /v1/mt5/symbols/:symbolName — Single symbol detail
 */
const getSymbolDetail = catchAsync(async (req, res) => {
  logger.info('Getting symbol detail: %s for user: %s', req.params.symbolName, req.user.id);
  await getMT5Credentials(req.user.id);

  const symbol = await mt5Service.fetchSymbolDetail(req.params.symbolName);
  res.status(httpStatus.OK).send({ success: true, symbol });
});

/**
 * GET /v1/mt5/orders/pending — Active pending orders
 */
const getPendingOrders = catchAsync(async (req, res) => {
  logger.info('Getting pending orders for user: %s', req.user.id);
  await getMT5Credentials(req.user.id);

  const result = await mt5Service.fetchPendingOrders();
  res.status(httpStatus.OK).send({ success: true, ...result });
});

/**
 * GET /v1/mt5/orders/history — Historical orders
 */
const getOrderHistory = catchAsync(async (req, res) => {
  logger.info('Getting order history for user: %s', req.user.id);
  await getMT5Credentials(req.user.id);

  const { from, to } = req.query;
  const result = await mt5Service.fetchOrderHistory(from || null, to || null);
  res.status(httpStatus.OK).send({ success: true, ...result });
});

/**
 * GET /v1/mt5/price-history — OHLC price bars
 */
const getPriceHistory = catchAsync(async (req, res) => {
  const { symbol, timeframe, from, to, count } = req.query;
  logger.info('Getting price history: %s %s for user: %s', symbol, timeframe, req.user.id);
  await getMT5Credentials(req.user.id);

  if (!symbol) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required query parameter: symbol');
  }

  const result = await mt5Service.fetchPriceHistory(
    symbol,
    timeframe || 'H1',
    from || null,
    to || null,
    parseInt(count, 10) || 500
  );
  res.status(httpStatus.OK).send({ success: true, ...result });
});

/**
 * GET /v1/mt5/ticks — Tick data
 */
const getTickData = catchAsync(async (req, res) => {
  const { symbol, count } = req.query;
  logger.info('Getting tick data: %s for user: %s', symbol, req.user.id);
  await getMT5Credentials(req.user.id);

  if (!symbol) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required query parameter: symbol');
  }

  const result = await mt5Service.fetchTickData(symbol, parseInt(count, 10) || 1000);
  res.status(httpStatus.OK).send({ success: true, ...result });
});

/**
 * GET /v1/mt5/terminal — Terminal info + latency
 */
const getTerminalInfo = catchAsync(async (req, res) => {
  logger.info('Getting terminal info for user: %s', req.user.id);
  await getMT5Credentials(req.user.id);

  const terminal = await mt5Service.fetchTerminalInfo();
  res.status(httpStatus.OK).send({ success: true, terminal });
});

/**
 * GET /v1/mt5/performance — All performance metrics
 */
const getPerformance = catchAsync(async (req, res) => {
  logger.info('Getting performance metrics for user: %s', req.user.id);
  const { user, decryptedPassword } = await getMT5Credentials(req.user.id);

  const { from } = req.query;
  const result = await mt5Service.fetchPerformance(
    user.mt5Account.accountId,
    user.mt5Account.server,
    decryptedPassword,
    from || null
  );
  res.status(httpStatus.OK).send({ success: true, ...result });
});

/**
 * POST /v1/mt5/full-sync-v2 — Comprehensive sync (everything)
 */
const fullSyncV2 = catchAsync(async (req, res) => {
  logger.info('Full sync v2 for user: %s', req.user.id);
  const { user, decryptedPassword } = await getMT5Credentials(req.user.id);

  // Find or create Account record
  const account = await findOrCreateAccount(req.user.id, user.mt5Account.accountId, user.mt5Account.server);

  // Clean up any corrupt trades (accountId: null) from previous buggy syncs
  // Also clean globally since unique index {accountId, ticket} conflicts when accountId is null
  const cleanupResult = await Trade.deleteMany({ accountId: null });
  if (cleanupResult.deletedCount > 0) {
    logger.info('Cleaned up %d corrupt trades (accountId: null) for user: %s', cleanupResult.deletedCount, req.user.id);
  }

  const { fromDate } = req.body;
  const result = await mt5Service.fullSyncV2(
    user.mt5Account.accountId,
    user.mt5Account.server,
    decryptedPassword,
    fromDate || null
  );

  // Save trades to MongoDB if Python returned any
  // IMPORTANT: Python DataNormalizer returns snake_case keys (open_time, net_profit, etc.)
  // We must map both snake_case AND camelCase to handle any adapter layer differences.
  const pythonTrades = result.trades || [];
  let savedCount = 0;
  if (pythonTrades.length > 0) {
    logger.info('Full sync v2: saving %d trades to MongoDB (sample keys: %s)', pythonTrades.length, Object.keys(pythonTrades[0]).join(', '));
    const transformedTrades = pythonTrades.map((trade) => ({
      accountId: account._id,
      entryTime: new Date(trade.entryTime || trade.open_time),
      exitTime: new Date(trade.exitTime || trade.close_time),
      profitLoss: trade.profitLoss || trade.net_profit || trade.netProfit || 0,
      session: trade.session || 'LONDON',
      stopLossHit: trade.stopLossHit || trade.stop_loss_hit || false,
      exitedEarly: trade.exitedEarly || trade.exited_early || false,
      riskPercentUsed: trade.riskPercentUsed || trade.risk_percent_used || null,
      riskRewardAchieved: trade.riskRewardAchieved || trade.risk_reward_achieved || null,
      targetPercentAchieved: trade.targetPercentAchieved || trade.target_percent_achieved || null,
      notes: trade.notes || trade.comment || '',
      mt5DealId: trade.mt5DealId || trade.dealOutId || trade.deal_out_id,
      mt5Symbol: trade.mt5Symbol || trade.symbol,
      ticket: trade.ticket,
      orderId: trade.orderId || trade.order_id,
      dealInId: trade.dealInId || trade.deal_in_id,
      dealOutId: trade.dealOutId || trade.deal_out_id,
      positionId: trade.positionId || trade.position_id,
      tradeType: trade.tradeType || trade.trade_type,
      volume: trade.volume,
      openPrice: trade.openPrice || trade.open_price,
      closePrice: trade.closePrice || trade.close_price,
      stopLoss: trade.stopLoss || trade.stop_loss,
      takeProfit: trade.takeProfit || trade.take_profit,
      commission: trade.commission || 0,
      swap: trade.swap || 0,
      netProfit: trade.netProfit || trade.net_profit,
      magicNumber: trade.magicNumber || trade.magic_number || 0,
      durationSeconds: trade.durationSeconds || trade.duration_seconds,
      source: {
        type: 'mt5',
        mt5AccountId: user.mt5Account.accountId,
      },
    }));

    const savedTrades = await tradeService.createBulkTrades(req.user.id, transformedTrades);
    savedCount = savedTrades.length;
    logger.info('Full sync v2: saved %d new trades to MongoDB', savedCount);
  }

  // Update account info if returned
  if (result.accountInfo) {
    try {
      account.balance = result.accountInfo.balance ?? account.balance;
      account.equity = result.accountInfo.equity ?? account.equity;
      account.margin = result.accountInfo.margin ?? account.margin;
      account.currency = result.accountInfo.currency ?? account.currency;
      account.leverage = result.accountInfo.leverage ?? account.leverage;
      account.lastSync = new Date();
      await account.save();
    } catch (e) {
      logger.warn('Failed to update account info: %s', e.message);
    }
  }

  // Update last sync time
  await userService.updateUserById(req.user.id, {
    'mt5Account.lastSyncAt': new Date(),
  });

  res.status(httpStatus.OK).send({
    success: true,
    ...result,
    savedTradesToDb: savedCount,
  });
});

module.exports = {
  connectMT5,
  syncTrades,
  getConnectionStatus,
  disconnectMT5,
  // D-NEW-2: MT5 Data Expansion
  getAccountFull,
  getSymbols,
  getSymbolDetail,
  getPendingOrders,
  getOrderHistory,
  getPriceHistory,
  getTickData,
  getTerminalInfo,
  getPerformance,
  fullSyncV2,
};
