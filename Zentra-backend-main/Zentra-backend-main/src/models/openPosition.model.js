const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const openPositionSchema = mongoose.Schema(
  {
    /** Reference to the Account this position belongs to */
    accountId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    /** MT5 position ticket number */
    ticket: {
      type: Number,
      required: true,
    },
    /** Trading symbol — e.g. "EURUSD", "XAUUSD" */
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    /** Trade direction: BUY or SELL */
    tradeType: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    /** Trade volume in lots */
    volume: {
      type: Number,
      required: true,
    },
    /** Price at which the position was opened */
    openPrice: {
      type: Number,
      required: true,
    },
    /** Current market price */
    currentPrice: {
      type: Number,
      required: false,
      default: 0,
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
    /** Timestamp when the position was opened */
    openTime: {
      type: Date,
      required: true,
    },
    /** Current floating (unrealized) profit/loss */
    floatingProfit: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Trading commission */
    commission: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Overnight swap charge */
    swap: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Expert Advisor magic number (0 if manual trade) */
    magicNumber: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for querying all positions of an account
openPositionSchema.index({ accountId: 1, ticket: 1 }, { unique: true });

openPositionSchema.plugin(toJSON);

const OpenPosition = mongoose.model('OpenPosition', openPositionSchema);

module.exports = OpenPosition;
