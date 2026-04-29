const express = require('express');
const auth = require('../../middlewares/auth');
const behaviorController = require('../../controllers/behavior.controller');

const router = express.Router();

/**
 * @route GET /v1/behavior/revenge-trading
 * @desc Detect revenge trading patterns
 * @query {string} [date] - Single date (YYYY-MM-DD)
 * @query {string} [startDate] - Start date range
 * @query {string} [endDate] - End date range
 * @access Private
 */
router.get('/revenge-trading', auth(), behaviorController.getRevengeTrading);

/**
 * @route GET /v1/behavior/early-exits
 * @desc Detect early exit patterns
 * @access Private
 */
router.get('/early-exits', auth(), behaviorController.getEarlyExits);

/**
 * @route GET /v1/behavior/overtrading
 * @desc Detect overtrading patterns
 * @access Private
 */
router.get('/overtrading', auth(), behaviorController.getOvertrading);

/**
 * @route GET /v1/behavior/impulsive-entries
 * @desc Detect impulsive entry patterns
 * @access Private
 */
router.get('/impulsive-entries', auth(), behaviorController.getImpulsiveEntries);

/**
 * @route GET /v1/behavior/mental-battery
 * @desc Calculate composite mental battery score
 * @access Private
 */
router.get('/mental-battery', auth(), behaviorController.getMentalBattery);

/**
 * @route GET /v1/behavior/full-analysis
 * @desc Run all behavioral analyses at once
 * @access Private
 */
router.get('/full-analysis', auth(), behaviorController.getFullAnalysis);

/**
 * @route GET /v1/behavior/coach-advice
 * @desc Get coach advice based on recent trades
 * @access Private
 */
router.get('/coach-advice', auth(), behaviorController.getCoachAdvice);

module.exports = router;
