const logger = require('../config/logger');
const { OpenPosition } = require('../models');

/**
 * Replace all open positions for an account with fresh data from MT5.
 * This is called during each sync — MT5 positions are ephemeral,
 * so we delete all existing and insert the current state.
 *
 * @param {ObjectId} accountId
 * @param {Array<Object>} positions - Array of position data from MT5
 * @returns {Promise<Array<OpenPosition>>}
 */
const upsertPositions = async (accountId, positions) => {
  logger.info('[OpenPositionService] Upserting %d positions for account: %s', positions.length, accountId);

  // Delete all existing positions for this account
  const deleteResult = await OpenPosition.deleteMany({ accountId });
  logger.info('[OpenPositionService] Deleted %d old positions', deleteResult.deletedCount);

  if (!positions || positions.length === 0) {
    logger.info('[OpenPositionService] No open positions to insert');
    return [];
  }

  // Insert fresh positions
  const positionDocs = positions.map((pos) => ({
    accountId,
    ticket: pos.ticket,
    symbol: pos.symbol,
    tradeType: pos.tradeType,
    volume: pos.volume,
    openPrice: pos.openPrice,
    currentPrice: pos.currentPrice || 0,
    stopLoss: pos.stopLoss || null,
    takeProfit: pos.takeProfit || null,
    openTime: pos.openTime,
    floatingProfit: pos.floatingProfit || 0,
    commission: pos.commission || 0,
    swap: pos.swap || 0,
    magicNumber: pos.magicNumber || 0,
  }));

  const result = await OpenPosition.insertMany(positionDocs);
  logger.info('[OpenPositionService] Inserted %d new positions', result.length);
  return result;
};

/**
 * Get all open positions for an account
 * @param {ObjectId} accountId
 * @returns {Promise<Array<OpenPosition>>}
 */
const getPositions = async (accountId) => {
  logger.info('[OpenPositionService] Getting positions for account: %s', accountId);
  const positions = await OpenPosition.find({ accountId })
    .sort({ openTime: -1 })
    .lean();
  logger.info('[OpenPositionService] Found %d positions', positions.length);
  return positions;
};

/**
 * Clear all positions for an account (e.g. when disconnecting)
 * @param {ObjectId} accountId
 * @returns {Promise<number>} - Number of deleted positions
 */
const clearPositions = async (accountId) => {
  logger.info('[OpenPositionService] Clearing positions for account: %s', accountId);
  const result = await OpenPosition.deleteMany({ accountId });
  logger.info('[OpenPositionService] Cleared %d positions', result.deletedCount);
  return result.deletedCount;
};

module.exports = {
  upsertPositions,
  getPositions,
  clearPositions,
};
