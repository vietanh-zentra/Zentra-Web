const path = require('path');
const logger = require('../config/logger');

// Load broker registry from JSON file
let brokerRegistry = [];
try {
  brokerRegistry = require('../data/broker_registry.json');
  logger.info(`Loaded ${brokerRegistry.length} brokers from registry`);
} catch (err) {
  logger.warn('broker_registry.json not found or invalid, using empty list');
}

/**
 * Search and filter brokers
 * @param {Object} options - { search, type, region }
 * @returns {Array} filtered broker list (without server details for performance)
 */
const getBrokers = ({ search, type, region } = {}) => {
  let results = brokerRegistry;

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.display_name.toLowerCase().includes(q) ||
        (b.aliases && b.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }

  if (type) {
    results = results.filter((b) => b.type === type);
  }

  if (region) {
    results = results.filter((b) => b.region === region || b.region === 'global');
  }

  // Return lightweight list (without full server arrays)
  return results.map((b) => ({
    id: b.id,
    name: b.name,
    display_name: b.display_name,
    type: b.type,
    region: b.region,
    server_count: b.servers ? b.servers.length : 0,
  }));
};

/**
 * Get broker by ID with full details
 */
const getBrokerById = (id) => {
  return brokerRegistry.find((b) => b.id === id) || null;
};

/**
 * Get servers for a specific broker
 */
const getBrokerServers = (id) => {
  const broker = brokerRegistry.find((b) => b.id === id);
  return broker ? broker.servers : null;
};

module.exports = {
  getBrokers,
  getBrokerById,
  getBrokerServers,
};
