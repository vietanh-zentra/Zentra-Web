const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const dailySummarySchema = mongoose.Schema(
  {
    /** Reference to the Account this summary belongs to */
    accountId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Account',
      required: true,
    },
    /** The date this summary represents (start of day, UTC) */
    date: {
      type: Date,
      required: true,
    },
    /** Total number of closed trades on this day */
    totalTrades: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Number of winning trades (profitLoss > 0) */
    winningTrades: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Number of losing trades (profitLoss < 0) */
    losingTrades: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Number of break-even trades (profitLoss == 0) */
    breakEvenTrades: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Sum of all trade profits (raw profit before commission/swap) */
    totalProfit: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Sum of all commissions paid */
    totalCommission: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Sum of all swap charges */
    totalSwap: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Net profit = totalProfit + totalCommission + totalSwap */
    netProfit: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Total volume traded in lots */
    totalVolume: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Win rate percentage (winningTrades / totalTrades * 100) */
    winRate: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Largest single winning trade profit */
    largestWin: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Largest single losing trade loss (stored as negative) */
    largestLoss: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index: one summary per account per day
dailySummarySchema.index({ accountId: 1, date: -1 }, { unique: true });

dailySummarySchema.plugin(toJSON);
dailySummarySchema.plugin(paginate);

const DailySummary = mongoose.model('DailySummary', dailySummarySchema);

module.exports = DailySummary;
