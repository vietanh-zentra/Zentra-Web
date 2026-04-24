const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const syncLogSchema = mongoose.Schema(
  {
    /** Reference to the Account being synced */
    accountId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    /** Type of sync operation */
    syncType: {
      type: String,
      enum: ['full', 'incremental'],
      required: true,
      default: 'full',
    },
    /** Current status of the sync operation */
    status: {
      type: String,
      enum: ['in_progress', 'success', 'failed'],
      required: true,
      default: 'in_progress',
    },
    /** Number of trades synced in this operation */
    tradesSynced: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Number of new trades inserted (not duplicates) */
    newTradesInserted: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Number of open positions fetched */
    openPositionsFetched: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Time taken to connect to MT5 in milliseconds */
    connectionTimeMs: {
      type: Number,
      required: false,
    },
    /** Total sync duration in milliseconds */
    totalTimeMs: {
      type: Number,
      required: false,
    },
    /** Date range start for the sync */
    fromDate: {
      type: Date,
      required: false,
    },
    /** Date range end for the sync */
    toDate: {
      type: Date,
      required: false,
    },
    /** Error message if sync failed */
    errorMessage: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    /** Error code from ErrorCodes (e.g. MT5_CONNECTION_TIMEOUT) */
    errorCode: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    /** When the sync operation started */
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    /** When the sync operation completed (success or failed) */
    completedAt: {
      type: Date,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for querying sync history by account, most recent first
syncLogSchema.index({ accountId: 1, startedAt: -1 });
// Index for finding in-progress syncs (to prevent double sync)
syncLogSchema.index({ accountId: 1, status: 1 });

syncLogSchema.plugin(toJSON);
syncLogSchema.plugin(paginate);

const SyncLog = mongoose.model('SyncLog', syncLogSchema);

module.exports = SyncLog;
