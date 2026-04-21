const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

/**
 * D-NEW-4: Performance Metrics Model
 * Stores comprehensive MT5 performance metrics (Sharpe, PF, MDD, etc.)
 * Data source: Hoà's PerformanceCalculator via POST /performance
 */
const performanceMetricsSchema = new mongoose.Schema(
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

    // Summary
    totalTrades: { type: Number, default: 0 },
    winningTrades: { type: Number, default: 0 },
    losingTrades: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },

    // P/L
    netProfitLoss: { type: Number, default: 0 },
    grossProfit: { type: Number, default: 0 },
    grossLoss: { type: Number, default: 0 },
    averageProfitLoss: { type: Number, default: 0 },
    averageWin: { type: Number, default: 0 },
    averageLoss: { type: Number, default: 0 },
    bestTrade: { type: Number, default: 0 },
    worstTrade: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    totalSwap: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },

    // Risk Metrics
    profitFactor: { type: Number, default: 0 },
    sharpeRatio: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 },
    maxDrawdownPercent: { type: Number, default: 0 },
    recoveryFactor: { type: Number, default: 0 },
    payoffRatio: { type: Number, default: 0 },
    expectancy: { type: Number, default: 0 },

    // Streaks
    maxWinStreak: { type: Number, default: 0 },
    maxLossStreak: { type: Number, default: 0 },

    // Time
    averageHoldTimeSeconds: { type: Number, default: 0 },
    tradesPerWeek: { type: Number, default: 0 },

    // Long vs Short
    longTrades: { type: Number, default: 0 },
    shortTrades: { type: Number, default: 0 },
    longProfit: { type: Number, default: 0 },
    shortProfit: { type: Number, default: 0 },

    // By Symbol breakdown
    bySymbol: {
      type: mongoose.SchemaTypes.Mixed,
      default: {},
    },

    // Snapshot metadata
    snapshotDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    tradesAnalyzed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

performanceMetricsSchema.index({ userId: 1, accountId: 1, snapshotDate: -1 });
performanceMetricsSchema.plugin(toJSON);

const PerformanceMetrics = mongoose.model('PerformanceMetrics', performanceMetricsSchema);
module.exports = PerformanceMetrics;
