/**
 * Bulk Insert Performance Test — Task D5
 *
 * Tests that the system can handle inserting 1000 trades at once
 * without timing out or corrupting data.
 *
 * Author: Dũng (Backend Lead) — added by Hoà during integration review
 */

const mongoose = require('mongoose');
const { Trade } = require('../../src/models');
const setupTestDB = require('../utils/setupTestDB');

setupTestDB();

// Helper: generate N mock MT5 trades
function generateTrades(userId, accountId, count) {
  return Array.from({ length: count }, (_, i) => ({
    userId,
    accountId,
    entryTime: new Date(Date.now() - (count - i) * 3600000),
    exitTime: new Date(Date.now() - (count - i - 1) * 3600000),
    profitLoss: parseFloat((Math.random() * 200 - 100).toFixed(2)),
    session: ['LONDON', 'NY', 'ASIA', 'SYDNEY'][i % 4],
    stopLossHit: i % 5 === 0,
    exitedEarly: i % 7 === 0,
    mt5Symbol: ['EURUSD', 'XAUUSD', 'GBPUSD', 'USDJPY'][i % 4],
    ticket: 100000 + i,
    tradeType: i % 2 === 0 ? 'BUY' : 'SELL',
    volume: parseFloat((0.01 + (i % 10) * 0.01).toFixed(2)),
    openPrice: parseFloat((1.0 + Math.random() * 0.5).toFixed(5)),
    closePrice: parseFloat((1.0 + Math.random() * 0.5).toFixed(5)),
    commission: parseFloat((-0.7 - Math.random()).toFixed(2)),
    swap: parseFloat((-0.5 + Math.random()).toFixed(2)),
    netProfit: parseFloat((Math.random() * 200 - 100).toFixed(2)),
    magicNumber: 0,
    durationSeconds: 3600 + i * 10,
  }));
}

describe('Bulk Insert Performance Tests (Task D5)', () => {
  const userId = new mongoose.Types.ObjectId();
  const accountId = new mongoose.Types.ObjectId();

  test('should bulk insert 1000 trades within 10 seconds', async () => {
    const trades = generateTrades(userId, accountId, 1000);

    const start = Date.now();
    const result = await Trade.insertMany(trades, { ordered: false });
    const elapsed = Date.now() - start;

    console.log(`  Inserted ${result.length} trades in ${elapsed}ms`);

    expect(result.length).toBe(1000);
    expect(elapsed).toBeLessThan(10000); // Must complete within 10s

    // Verify all records are in DB
    const count = await Trade.countDocuments({ accountId });
    expect(count).toBe(1000);
  }, 15000); // 15s Jest timeout

  test('should correctly query paginated results after bulk insert', async () => {
    const trades = generateTrades(userId, accountId, 1000);
    await Trade.insertMany(trades, { ordered: false });

    // Page 1 — 50 per page
    const page1 = await Trade.find({ accountId })
      .sort({ entryTime: -1 })
      .skip(0)
      .limit(50)
      .lean();

    expect(page1.length).toBe(50);

    // Page 20 — last page
    const page20 = await Trade.find({ accountId })
      .sort({ entryTime: -1 })
      .skip(950)
      .limit(50)
      .lean();

    expect(page20.length).toBe(50);

    console.log(`  Pagination OK: page1[0].ticket=${page1[0].ticket}, page20[0].ticket=${page20[0].ticket}`);
  }, 15000);

  test('should filter by symbol after bulk insert', async () => {
    const trades = generateTrades(userId, accountId, 1000);
    await Trade.insertMany(trades, { ordered: false });

    const eurusdTrades = await Trade.find({ accountId, mt5Symbol: 'EURUSD' }).lean();

    // Every 4th trade is EURUSD (i % 4 === 0), so ~250 out of 1000
    expect(eurusdTrades.length).toBeGreaterThan(200);
    expect(eurusdTrades.length).toBeLessThan(300);
    console.log(`  EURUSD filter: ${eurusdTrades.length} trades found`);
  }, 15000);

  test('should handle duplicate ticket gracefully (upsert pattern)', async () => {
    const trades = generateTrades(userId, accountId, 10);
    await Trade.insertMany(trades, { ordered: false });

    // Try inserting the same 10 trades again — should not throw but skip dups
    // Using ordered: false so it continues past duplicate key errors
    let errorCount = 0;
    try {
      await Trade.insertMany(trades, { ordered: false });
    } catch (err) {
      // BulkWriteError is expected for duplicate tickets
      errorCount = err.result?.nInserted || 0;
    }

    // DB should still only have 10 unique records (ticket index is unique+sparse)
    const count = await Trade.countDocuments({ accountId, ticket: { $gte: 100000, $lt: 100010 } });
    expect(count).toBe(10);
    console.log(`  Duplicate handling OK: ${count} unique records in DB`);
  }, 15000);
});
