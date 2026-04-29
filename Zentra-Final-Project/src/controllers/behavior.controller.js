const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { behaviorService } = require('../services');
const logger = require('../config/logger');

/**
 * GET /v1/behavior/revenge-trading
 * Detect revenge trading patterns for the authenticated user
 */
const getRevengeTrading = catchAsync(async (req, res) => {
  logger.info('Getting revenge trading analysis for user: %s', req.user.id);
  const result = await behaviorService.analyzeRevenge(req.user.id, req.query);
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/behavior/early-exits
 * Detect early exit patterns
 */
const getEarlyExits = catchAsync(async (req, res) => {
  logger.info('Getting early exit analysis for user: %s', req.user.id);
  const result = await behaviorService.analyzeEarlyExits(req.user.id, req.query);
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/behavior/overtrading
 * Detect overtrading patterns
 */
const getOvertrading = catchAsync(async (req, res) => {
  logger.info('Getting overtrading analysis for user: %s', req.user.id);
  const result = await behaviorService.analyzeOvertrading(req.user.id, req.query);
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/behavior/impulsive-entries
 * Detect impulsive entry patterns
 */
const getImpulsiveEntries = catchAsync(async (req, res) => {
  logger.info('Getting impulsive entries analysis for user: %s', req.user.id);
  const result = await behaviorService.analyzeImpulsiveEntries(req.user.id, req.query);
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/behavior/mental-battery
 * Calculate composite mental battery score
 */
const getMentalBattery = catchAsync(async (req, res) => {
  logger.info('Getting mental battery for user: %s', req.user.id);
  const result = await behaviorService.calculateMentalBattery(req.user.id, req.query);
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/behavior/full-analysis
 * Run all behavioral analyses at once
 */
const getFullAnalysis = catchAsync(async (req, res) => {
  logger.info('Getting full behavioral analysis for user: %s', req.user.id);
  const result = await behaviorService.runFullAnalysis(req.user.id, req.query);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  getRevengeTrading,
  getEarlyExits,
  getOvertrading,
  getImpulsiveEntries,
  getMentalBattery,
  getFullAnalysis,
};
