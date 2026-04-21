const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

/**
 * D-NEW-4: Price Bar Model (OHLC)
 * Stores historical price data from MT5
 * Data source: Hoà's get_price_history() via POST /price-history
 *
 * NOTE: This is for caching. Millions of bars can come from MT5,
 * so we limit storage and use TTL index for auto-cleanup.
 */
const priceBarSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, trim: true, index: true },
    timeframe: {
      type: String,
      enum: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'],
      required: true,
    },
    time: { type: Date, required: true },
    timestamp: { type: Number, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    tickVolume: { type: Number, default: 0 },
    spread: { type: Number, default: 0 },
    realVolume: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound unique: one bar per symbol + timeframe + timestamp
priceBarSchema.index({ symbol: 1, timeframe: 1, timestamp: 1 }, { unique: true });

// TTL: auto-delete bars older than 30 days to save space
priceBarSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

priceBarSchema.plugin(toJSON);

const PriceBar = mongoose.model('PriceBar', priceBarSchema);
module.exports = PriceBar;
