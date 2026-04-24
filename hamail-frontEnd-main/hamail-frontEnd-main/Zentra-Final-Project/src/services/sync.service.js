const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { ErrorCodes } = require('../utils/errorCodes');
const logger = require('../config/logger');
const { SyncLog } = require('../models');

/**
 * Create a new sync log entry (status = in_progress)
 * Also checks if there's already a sync in progress for this account.
 * @param {ObjectId} accountId
 * @param {string} syncType - 'full' or 'incremental'
 * @param {Object} [options] - { fromDate, toDate }
 * @returns {Promise<SyncLog>}
 */
const createSyncLog = async (accountId, syncType = 'full', options = {}) => {
  logger.info('[SyncService] Creating sync log for account: %s, type: %s', accountId, syncType);

  // Check for existing in-progress sync
  const inProgress = await SyncLog.findOne({ accountId, status: 'in_progress' });
  if (inProgress) {
    logger.warn('[SyncService] Sync already in progress for account: %s (syncId: %s)', accountId, inProgress.id);
    throw new ApiError(httpStatus.CONFLICT, 'A sync operation is already in progress for this account', {
      code: ErrorCodes.SYNC_IN_PROGRESS,
    });
  }

  const syncLog = new SyncLog({
    accountId,
    syncType,
    status: 'in_progress',
    startedAt: new Date(),
    fromDate: options.fromDate || null,
    toDate: options.toDate || null,
  });
  await syncLog.save();

  logger.info('[SyncService] Sync log created: %s', syncLog.id);
  return syncLog;
};

/**
 * Update sync status to success
 * @param {ObjectId} syncLogId
 * @param {Object} details - { tradesSynced, newTradesInserted, openPositionsFetched, connectionTimeMs, totalTimeMs }
 * @returns {Promise<SyncLog>}
 */
const markSyncSuccess = async (syncLogId, details = {}) => {
  logger.info('[SyncService] Marking sync as success: %s', syncLogId);

  const syncLog = await SyncLog.findById(syncLogId);
  if (!syncLog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sync log not found');
  }

  Object.assign(syncLog, {
    status: 'success',
    completedAt: new Date(),
    tradesSynced: details.tradesSynced || 0,
    newTradesInserted: details.newTradesInserted || 0,
    openPositionsFetched: details.openPositionsFetched || 0,
    connectionTimeMs: details.connectionTimeMs || null,
    totalTimeMs: details.totalTimeMs || Date.now() - syncLog.startedAt.getTime(),
  });
  await syncLog.save();

  logger.info('[SyncService] Sync completed successfully: %s (trades: %d, new: %d)',
    syncLogId, syncLog.tradesSynced, syncLog.newTradesInserted);
  return syncLog;
};

/**
 * Update sync status to failed
 * @param {ObjectId} syncLogId
 * @param {string} errorMessage
 * @param {string} [errorCode] - ErrorCode from errorCodes.js
 * @returns {Promise<SyncLog>}
 */
const markSyncFailed = async (syncLogId, errorMessage, errorCode = null) => {
  logger.error('[SyncService] Marking sync as failed: %s, error: %s, code: %s', syncLogId, errorMessage, errorCode);

  const syncLog = await SyncLog.findById(syncLogId);
  if (!syncLog) {
    // If sync log not found, just log and return — don't throw during error handling
    logger.error('[SyncService] Sync log not found for failure update: %s', syncLogId);
    return null;
  }

  Object.assign(syncLog, {
    status: 'failed',
    completedAt: new Date(),
    errorMessage,
    errorCode,
    totalTimeMs: Date.now() - syncLog.startedAt.getTime(),
  });
  await syncLog.save();

  logger.info('[SyncService] Sync marked as failed: %s', syncLogId);
  return syncLog;
};

/**
 * Get sync history for an account (most recent first)
 * @param {ObjectId} accountId
 * @param {number} [limit=20]
 * @returns {Promise<Array<SyncLog>>}
 */
const getSyncHistory = async (accountId, limit = 20) => {
  logger.info('[SyncService] Getting sync history for account: %s (limit: %d)', accountId, limit);
  return SyncLog.find({ accountId })
    .sort({ startedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get the latest sync log for an account
 * @param {ObjectId} accountId
 * @returns {Promise<SyncLog|null>}
 */
const getLatestSync = async (accountId) => {
  return SyncLog.findOne({ accountId })
    .sort({ startedAt: -1 })
    .lean();
};

/**
 * Check if a sync is currently in progress
 * @param {ObjectId} accountId
 * @returns {Promise<boolean>}
 */
const isSyncInProgress = async (accountId) => {
  const inProgress = await SyncLog.findOne({ accountId, status: 'in_progress' });
  return !!inProgress;
};

module.exports = {
  createSyncLog,
  markSyncSuccess,
  markSyncFailed,
  getSyncHistory,
  getLatestSync,
  isSyncInProgress,
};
