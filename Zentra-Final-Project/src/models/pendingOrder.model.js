const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

/**
 * D-NEW-4: Pending Order Model
 * Stores active pending orders from MT5
 * Data source: Hoà's get_pending_orders() via GET /orders/pending
 */
const pendingOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },

    // MT5 data
    ticket: { type: Number, required: true },
    symbol: { type: String, required: true, trim: true },
    type: { type: Number },
    typeName: {
      type: String,
      enum: ['BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP', 'BUY_STOP_LIMIT', 'SELL_STOP_LIMIT'],
      required: true,
    },
    volume: { type: Number, required: true },
    volumeInitial: { type: Number },
    priceOpen: { type: Number, required: true },
    priceCurrent: { type: Number },
    stopLoss: { type: Number, default: null },
    takeProfit: { type: Number, default: null },
    timeSetup: { type: Date },
    timeExpiration: { type: Date, default: null },
    state: { type: Number },
    magic: { type: Number, default: 0 },
    comment: { type: String, default: '', trim: true },
    positionId: { type: Number, default: 0 },

    // Sync metadata
    lastSyncAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Unique constraint: one order per ticket per account
pendingOrderSchema.index({ accountId: 1, ticket: 1 }, { unique: true });
pendingOrderSchema.plugin(toJSON);

const PendingOrder = mongoose.model('PendingOrder', pendingOrderSchema);
module.exports = PendingOrder;
