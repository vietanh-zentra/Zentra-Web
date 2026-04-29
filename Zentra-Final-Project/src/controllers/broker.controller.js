const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { brokerService } = require('../services');
const logger = require('../config/logger');

/**
 * GET /v1/brokers
 * List all brokers with optional search/filter
 * @query {string} [search] - Search by name
 * @query {string} [type] - Filter by type (broker/propfirm)
 * @query {string} [region] - Filter by region
 */
const getBrokers = catchAsync(async (req, res) => {
  const { search, type, region } = req.query;
  logger.info('Getting broker list — search=%s type=%s region=%s', search, type, region);
  const brokers = brokerService.getBrokers({ search, type, region });
  res.status(httpStatus.OK).send({
    success: true,
    brokers,
    count: brokers.length,
  });
});

/**
 * GET /v1/brokers/:id
 * Get specific broker details including server list
 */
const getBrokerById = catchAsync(async (req, res) => {
  const broker = brokerService.getBrokerById(req.params.id);
  if (!broker) {
    return res.status(httpStatus.NOT_FOUND).send({
      success: false,
      message: `Broker '${req.params.id}' not found`,
    });
  }
  res.status(httpStatus.OK).send({ success: true, broker });
});

/**
 * GET /v1/brokers/:id/servers
 * Get server list for a specific broker
 */
const getBrokerServers = catchAsync(async (req, res) => {
  const servers = brokerService.getBrokerServers(req.params.id);
  if (!servers) {
    return res.status(httpStatus.NOT_FOUND).send({
      success: false,
      message: `Broker '${req.params.id}' not found`,
    });
  }
  res.status(httpStatus.OK).send({
    success: true,
    servers,
    count: servers.length,
  });
});

module.exports = {
  getBrokers,
  getBrokerById,
  getBrokerServers,
};
