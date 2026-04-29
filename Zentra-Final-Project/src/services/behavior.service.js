const logger = require('../config/logger');
const axios = require('axios');
const config = require('../config/config');

/**
 * Call Python behavior_analyzer via Flask API on MT5 engine.
 * Flask auto-fetches trades from active MT5 session when no trades provided.
 * We pass date filters so Flask can scope the trade query.
 */
const callPythonAnalyzer = async (endpoint, query = {}) => {
  try {
    const mt5Url = (config.mt5 && config.mt5.apiUrl) || process.env.MT5_ENGINE_URL || 'http://localhost:5000';

    // Build request body with date filters (Flask will auto-fetch trades)
    const body = {};
    if (query.date) body.date = query.date;
    if (query.startDate) body.startDate = query.startDate;
    if (query.endDate) body.endDate = query.endDate;

    const response = await axios.post(`${mt5Url}/behavior/${endpoint}`, body, {
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
  return callPythonAnalyzer('revenge-trading', query);
};

/**
 * Analyze early exits for a user
 */
const analyzeEarlyExits = async (userId, query = {}) => {
  return callPythonAnalyzer('early-exits', query);
};

/**
 * Analyze overtrading for a user
 */
const analyzeOvertrading = async (userId, query = {}) => {
  return callPythonAnalyzer('overtrading', query);
};

/**
 * Analyze impulsive entries for a user
 */
const analyzeImpulsiveEntries = async (userId, query = {}) => {
  return callPythonAnalyzer('impulsive-entries', query);
};

/**
 * Calculate mental battery score for a user
 */
const calculateMentalBattery = async (userId, query = {}) => {
  return callPythonAnalyzer('mental-battery', query);
};

/**
 * Run all behavioral analyses at once
 */
const runFullAnalysis = async (userId, query = {}) => {
  return callPythonAnalyzer('full-analysis', query);
};

/**
 * Get coach advice for a user
 */
const getCoachAdvice = async (userId, query = {}) => {
  return callPythonAnalyzer('coach-advice', query);
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
