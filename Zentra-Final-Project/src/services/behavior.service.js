const { Trade } = require('../models');
const logger = require('../config/logger');
const axios = require('axios');
const config = require('../config/config');

/**
 * Get trade data for a user within optional date range
 * NOTE: Trade model uses entryTime/exitTime (not openTime/closeTime)
 */
const getUserTrades = async (userId, query = {}) => {
  const filter = { userId };

  if (query.startDate || query.endDate || query.date) {
    filter.exitTime = {};
    if (query.date) {
      // Single day analysis
      const dayStart = new Date(query.date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(query.date);
      dayEnd.setUTCHours(23, 59, 59, 999);
      filter.exitTime = { $gte: dayStart, $lte: dayEnd };
    } else {
      if (query.startDate) filter.exitTime.$gte = new Date(query.startDate);
      if (query.endDate) filter.exitTime.$lte = new Date(query.endDate);
    }
  }

  const trades = await Trade.find(filter)
    .sort({ exitTime: 1 })
    .lean();

  return trades;
};

/**
 * Call Python behavior_analyzer via Flask API on MT5 engine
 */
const callPythonAnalyzer = async (endpoint, trades) => {
  try {
    const mt5Url = (config.mt5 && config.mt5.apiUrl) || process.env.MT5_ENGINE_URL || 'http://localhost:5000';
    const response = await axios.post(`${mt5Url}/behavior/${endpoint}`, {
      trades,
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    logger.error('Python analyzer call failed for %s: %s', endpoint, error.message);
    throw new Error(`Behavioral analysis service unavailable: ${error.message}`);
  }
};

/**
 * Analyze revenge trading for a user
 */
const analyzeRevenge = async (userId, query = {}) => {
  const trades = await getUserTrades(userId, query);
  if (trades.length < 2) {
    return {
      detected: false, count: 0, severity: 'none',
      revenge_rate: 0, trades: [],
      message: 'Not enough trades for revenge trading analysis'
    };
  }
  return callPythonAnalyzer('revenge-trading', trades);
};

/**
 * Analyze early exits for a user
 */
const analyzeEarlyExits = async (userId, query = {}) => {
  const trades = await getUserTrades(userId, query);
  if (trades.length < 5) {
    return {
      rate: 0, count: 0, trades: [],
      insufficient_data: true,
      message: 'Need at least 5 trades for early exit analysis'
    };
  }
  return callPythonAnalyzer('early-exits', trades);
};

/**
 * Analyze overtrading for a user
 */
const analyzeOvertrading = async (userId, query = {}) => {
  const trades = await getUserTrades(userId, query);
  if (trades.length < 3) {
    return {
      detected: false, daily_avg: 0, overtrading_days: 0,
      daily_breakdown: [],
      message: 'Not enough trades for overtrading analysis'
    };
  }
  return callPythonAnalyzer('overtrading', trades);
};

/**
 * Analyze impulsive entries for a user
 */
const analyzeImpulsiveEntries = async (userId, query = {}) => {
  const trades = await getUserTrades(userId, query);
  if (trades.length < 3) {
    return {
      rate: 0, cluster_count: 0, clusters: [],
      insufficient_data: true,
      message: 'Not enough trades for impulsive entry analysis'
    };
  }
  return callPythonAnalyzer('impulsive-entries', trades);
};

/**
 * Calculate mental battery score for a user
 */
const calculateMentalBattery = async (userId, query = {}) => {
  const trades = await getUserTrades(userId, query);
  if (trades.length < 3) {
    return {
      percentage: 50, level: 'unknown',
      message: 'Not enough trading data for mental battery calculation',
      factors: [], insufficient_data: true
    };
  }
  return callPythonAnalyzer('mental-battery', trades);
};

/**
 * Run all behavioral analyses at once
 */
const runFullAnalysis = async (userId, query = {}) => {
  const trades = await getUserTrades(userId, query);
  if (trades.length < 3) {
    return {
      message: 'Not enough trades for full behavioral analysis',
      trade_count: trades.length,
      insufficient_data: true
    };
  }
  return callPythonAnalyzer('full-analysis', trades);
};

/**
 * Get coach advice for a user
 */
const getCoachAdvice = async (userId, query = {}) => {
  const trades = await getUserTrades(userId, query);
  if (trades.length === 0) {
    return {
      error_type: 'clean',
      lines: [
        'No recent trading data available.',
        'Sync your MT5 account to get personalized advice.'
      ],
      insufficient_data: true
    };
  }
  return callPythonAnalyzer('coach-advice', trades);
};

module.exports = {
  analyzeRevenge,
  analyzeEarlyExits,
  analyzeOvertrading,
  analyzeImpulsiveEntries,
  calculateMentalBattery,
  runFullAnalysis,
  getCoachAdvice,
};
