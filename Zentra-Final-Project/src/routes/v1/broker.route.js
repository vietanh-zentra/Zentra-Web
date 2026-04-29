const express = require('express');
const brokerController = require('../../controllers/broker.controller');

const router = express.Router();

/**
 * @route GET /v1/brokers
 * @desc List all brokers (public endpoint, no auth required)
 * @query {string} [search] - Search by broker name
 * @query {string} [type] - Filter: "broker" or "propfirm"
 * @query {string} [region] - Filter by region
 */
router.get('/', brokerController.getBrokers);

/**
 * @route GET /v1/brokers/:id
 * @desc Get specific broker details
 */
router.get('/:id', brokerController.getBrokerById);

/**
 * @route GET /v1/brokers/:id/servers
 * @desc Get server list for a specific broker
 */
router.get('/:id/servers', brokerController.getBrokerServers);

module.exports = router;
