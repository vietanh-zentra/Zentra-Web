const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { TradingSessions } = require('./enums');

const tradeSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entryTime: {
      type: Date,
      required: true,
    },
    exitTime: {
      type: Date,
      required: true,
    },
    riskPercentUsed: {
      type: Number,
      required: false,
      min: 0,
      default: null,
    },
    profitLoss: {
      type: Number,
      required: true,
    },
    riskRewardAchieved: {
      type: Number,
      required: false,
      default: null,
    },
    session: {
      type: String,
      enum: Object.values(TradingSessions),
      required: true,
    },
    stopLossHit: {
      type: Boolean,
      required: true,
    },
    exitedEarly: {
      type: Boolean,
      required: true,
    },
    targetPercentAchieved: {
      type: Number,
      required: false,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
    mt5DealId: {
      type: Number,
      required: false,
      index: true,
    },
    mt5Symbol: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    source: {
      type: {
        type: String,
        enum: ['manual', 'mt5'],
        default: 'manual',
      },
      mt5AccountId: {
        type: String,
        trim: true,
      },
    },

    // ─── MT5 Raw Data Fields (added for MT5 data pipeline) ───────────
    // These fields store the raw trading data from MetaTrader 5.
    // All are optional to maintain backward compatibility with existing trades.

    /** MT5 deal ticket number — unique identifier per trade in MT5 */
    ticket: {
      type: Number,
      required: false,
      index: true,
    },
    /** MT5 order ID that opened this trade */
    orderId: {
      type: Number,
      required: false,
    },
    /** MT5 deal ID for the opening deal (DEAL_ENTRY_IN) */
    dealInId: {
      type: Number,
      required: false,
    },
    /** MT5 deal ID for the closing deal (DEAL_ENTRY_OUT) */
    dealOutId: {
      type: Number,
      required: false,
    },
    /** MT5 position ID — links the open and close deals together */
    positionId: {
      type: Number,
      required: false,
      index: true,
    },
    /** Trade direction: BUY or SELL */
    tradeType: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: false,
    },
    /** Trade volume in lots (e.g. 0.01, 0.1, 1.0) */
    volume: {
      type: Number,
      required: false,
    },
    /** Price at which the trade was opened */
    openPrice: {
      type: Number,
      required: false,
    },
    /** Price at which the trade was closed */
    closePrice: {
      type: Number,
      required: false,
    },
    /** Stop loss price level (null if not set) */
    stopLoss: {
      type: Number,
      required: false,
      default: null,
    },
    /** Take profit price level (null if not set) */
    takeProfit: {
      type: Number,
      required: false,
      default: null,
    },
    /** Trading commission charged by broker */
    commission: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Overnight swap/rollover charge */
    swap: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Net profit = profitLoss + commission + swap + fee */
    netProfit: {
      type: Number,
      required: false,
    },
    /** Expert Advisor magic number (0 if manual trade) */
    magicNumber: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Trade duration in seconds (exitTime - entryTime) */
    durationSeconds: {
      type: Number,
      required: false,
    },
    /** Reference to the Account model (for multi-account support) */
    accountId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Account',
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Add indexes for better query performance
tradeSchema.index({ userId: 1, entryTime: -1 });
tradeSchema.index({ session: 1, entryTime: -1 });
tradeSchema.index({ entryTime: -1 });
tradeSchema.index({ 'source.mt5AccountId': 1 });
// New indexes for MT5 data pipeline queries
tradeSchema.index({ accountId: 1, entryTime: -1 });
tradeSchema.index({ accountId: 1, ticket: 1 }, { unique: true, sparse: true });

tradeSchema.plugin(toJSON);
tradeSchema.plugin(paginate);

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;

