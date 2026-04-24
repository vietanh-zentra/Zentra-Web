const logger = require('../config/logger');
const { DailySummary, Trade } = require('../models');

/**
 * Get start of day (midnight UTC)
 * @param {Date|string} dateInput
 * @returns {Date}
 */
const getStartOfDay = (dateInput) => {
  const date = new Date(dateInput);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/**
 * Get end of day (23:59:59.999 UTC)
 * @param {Date|string} dateInput
 * @returns {Date}
 */
const getEndOfDay = (dateInput) => {
  const date = new Date(dateInput);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
};

/**
 * Create or update a daily summary for a given account + date
 * @param {ObjectId} accountId
 * @param {Date} date
 * @param {Object} summaryData
 * @returns {Promise<DailySummary>}
 */
const upsertDailySummary = async (accountId, date, summaryData) => {
  const dayDate = getStartOfDay(date);
  logger.info('[DailySummaryService] Upserting summary for account: %s, date: %s', accountId, dayDate.toISOString());

  const result = await DailySummary.findOneAndUpdate(
    { accountId, date: dayDate },
    {
      accountId,
      date: dayDate,
      ...summaryData,
    },
    { upsert: true, new: true }
  );

  logger.info('[DailySummaryService] Summary upserted: trades=%d, netProfit=%s', result.totalTrades, result.netProfit);
  return result;
};

/**
 * Get daily summaries for an account within a date range
 * @param {ObjectId} accountId
 * @param {Date|string} [fromDate]
 * @param {Date|string} [toDate]
 * @returns {Promise<Array<DailySummary>>}
 */
const getSummaries = async (accountId, fromDate, toDate) => {
  logger.info('[DailySummaryService] Getting summaries for account: %s', accountId);

  const filter = { accountId };
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = getStartOfDay(fromDate);
    if (toDate) filter.date.$lte = getEndOfDay(toDate);
  }

  const summaries = await DailySummary.find(filter)
    .sort({ date: -1 })
    .lean();

  logger.info('[DailySummaryService] Found %d summaries', summaries.length);
  return summaries;
};

/**
 * Recalculate daily summary from actual trades in the database
 * @param {ObjectId} accountId
 * @param {Date} date
 * @returns {Promise<DailySummary>}
 */
const recalculate = async (accountId, date) => {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);

  logger.info('[DailySummaryService] Recalculating summary for account: %s, date: %s', accountId, startOfDay.toISOString());

  // Fetch all trades for this account on this day
  const trades = await Trade.find({
    accountId,
    entryTime: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  if (trades.length === 0) {
    // No trades — remove summary if it exists
    await DailySummary.deleteOne({ accountId, date: startOfDay });
    logger.info('[DailySummaryService] No trades for date, removed summary');
    return null;
  }

  // Calculate summary metrics
  let winningTrades = 0;
  let losingTrades = 0;
  let breakEvenTrades = 0;
  let totalProfit = 0;
  let totalCommission = 0;
  let totalSwap = 0;
  let totalVolume = 0;
  let largestWin = 0;
  let largestLoss = 0;

  trades.forEach((trade) => {
    const profit = trade.profitLoss || 0;
    totalProfit += profit;
    totalCommission += trade.commission || 0;
    totalSwap += trade.swap || 0;
    totalVolume += trade.volume || 0;

    if (profit > 0) {
      winningTrades += 1;
      if (profit > largestWin) largestWin = profit;
    } else if (profit < 0) {
      losingTrades += 1;
      if (profit < largestLoss) largestLoss = profit;
    } else {
      breakEvenTrades += 1;
    }
  });

  const totalTrades = trades.length;
  const netProfit = totalProfit + totalCommission + totalSwap;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const summaryData = {
    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    totalSwap: Math.round(totalSwap * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    totalVolume: Math.round(totalVolume * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    largestWin: Math.round(largestWin * 100) / 100,
    largestLoss: Math.round(largestLoss * 100) / 100,
  };

  const result = await upsertDailySummary(accountId, startOfDay, summaryData);
  logger.info('[DailySummaryService] Recalculated: %d trades, net=%s, winRate=%s%%',
    totalTrades, summaryData.netProfit, summaryData.winRate);
  return result;
};

/**
 * Recalculate summaries for all days that have trades for an account.
 * Useful after a bulk import.
 * @param {ObjectId} accountId
 * @param {Array<Object>} trades - Array of trade objects (must have entryTime)
 * @returns {Promise<number>} - Number of summaries recalculated
 */
const recalculateForTrades = async (accountId, trades) => {
  if (!trades || trades.length === 0) return 0;

  // Group trades by day
  const days = new Set();
  trades.forEach((trade) => {
    const dayKey = getStartOfDay(trade.entryTime).toISOString();
    days.add(dayKey);
  });

  logger.info('[DailySummaryService] Recalculating %d days after bulk import', days.size);

  // Recalculate each day
  await Promise.all(
    Array.from(days).map((dayIso) => recalculate(accountId, new Date(dayIso)))
  );

  return days.size;
};

module.exports = {
  upsertDailySummary,
  getSummaries,
  recalculate,
  recalculateForTrades,
};
