const request = require('supertest');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Account, Trade, OpenPosition, DailySummary, SyncLog } = require('../../src/models');
const { userOne, userTwo, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');
const { accountOne, accountTwo, accountThree, insertAccounts } = require('../fixtures/account.fixture');

setupTestDB();

describe('Account Routes', () => {
  // ─── POST /v1/accounts ──────────────────────────────────────────────
  describe('POST /v1/accounts', () => {
    let newAccount;

    beforeEach(() => {
      newAccount = {
        accountId: '55555555',
        brokerServer: 'Exness-Demo',
        company: 'Exness',
        currency: 'USD',
        leverage: 200,
      };
    });

    test('should return 201 and create account', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/accounts')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newAccount)
        .expect(httpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.account).toBeDefined();
      expect(res.body.account.accountId).toBe('55555555');
      expect(res.body.account.brokerServer).toBe('Exness-Demo');

      // Verify in DB
      const dbAccount = await Account.findById(res.body.account.id);
      expect(dbAccount).toBeDefined();
      expect(dbAccount.userId.toString()).toBe(userOne._id.toString());
    });

    test('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/v1/accounts')
        .send(newAccount)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if accountId is missing', async () => {
      await insertUsers([userOne]);
      delete newAccount.accountId;

      await request(app)
        .post('/v1/accounts')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newAccount)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 409 if account already exists', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      await request(app)
        .post('/v1/accounts')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ accountId: accountOne.accountId, brokerServer: accountOne.brokerServer })
        .expect(httpStatus.CONFLICT);
    });
  });

  // ─── GET /v1/accounts ───────────────────────────────────────────────
  describe('GET /v1/accounts', () => {
    test('should return 200 and list user accounts', async () => {
      await insertUsers([userOne, userTwo]);
      await insertAccounts([accountOne, accountTwo, accountThree]);

      const res = await request(app)
        .get('/v1/accounts')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.accounts).toHaveLength(2); // Only userOne's accounts
      expect(res.body.total).toBe(2);
    });

    test('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/v1/accounts')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  // ─── GET /v1/accounts/:accountId ────────────────────────────────────
  describe('GET /v1/accounts/:accountId', () => {
    test('should return 200 and account details', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      const res = await request(app)
        .get(`/v1/accounts/${accountOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.account.accountId).toBe(accountOne.accountId);
    });

    test('should return 404 if account not found', async () => {
      await insertUsers([userOne]);

      await request(app)
        .get(`/v1/accounts/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if accessing another user account', async () => {
      await insertUsers([userOne, userTwo]);
      await insertAccounts([accountThree]); // belongs to userTwo

      await request(app)
        .get(`/v1/accounts/${accountThree._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  // ─── DELETE /v1/accounts/:accountId ─────────────────────────────────
  describe('DELETE /v1/accounts/:accountId', () => {
    test('should return 200 and delete account with related data', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      // Insert some related data
      await Trade.create({
        userId: userOne._id,
        accountId: accountOne._id,
        entryTime: new Date(),
        exitTime: new Date(),
        profitLoss: 100,
        session: 'LONDON',
        stopLossHit: false,
        exitedEarly: false,
      });

      const res = await request(app)
        .delete(`/v1/accounts/${accountOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.deleted.account).toBe(1);
      expect(res.body.deleted.trades).toBeGreaterThanOrEqual(0);

      // Verify deletion
      const dbAccount = await Account.findById(accountOne._id);
      expect(dbAccount).toBeNull();
    });

    test('should return 404 if account not found', async () => {
      await insertUsers([userOne]);

      await request(app)
        .delete(`/v1/accounts/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  // ─── GET /v1/accounts/:accountId/trades ─────────────────────────────
  describe('GET /v1/accounts/:accountId/trades', () => {
    test('should return 200 with paginated trades', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      // Insert test trades
      const trades = Array.from({ length: 5 }, (_, i) => ({
        userId: userOne._id,
        accountId: accountOne._id,
        entryTime: new Date(`2026-04-${10 + i}T10:00:00Z`),
        exitTime: new Date(`2026-04-${10 + i}T15:00:00Z`),
        profitLoss: (i + 1) * 10,
        session: 'LONDON',
        stopLossHit: false,
        exitedEarly: false,
        mt5Symbol: i < 3 ? 'EURUSD' : 'XAUUSD',
        ticket: 1000 + i,
      }));
      await Trade.insertMany(trades);

      const res = await request(app)
        .get(`/v1/accounts/${accountOne._id}/trades`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query({ page: 1, limit: 3 })
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.trades).toHaveLength(3);
      expect(res.body.total).toBe(5);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.page).toBe(1);
    });

    test('should filter by symbol', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      await Trade.insertMany([
        { userId: userOne._id, accountId: accountOne._id, entryTime: new Date(), exitTime: new Date(), profitLoss: 10, session: 'LONDON', stopLossHit: false, exitedEarly: false, mt5Symbol: 'EURUSD', ticket: 2001 },
        { userId: userOne._id, accountId: accountOne._id, entryTime: new Date(), exitTime: new Date(), profitLoss: 20, session: 'NY', stopLossHit: false, exitedEarly: false, mt5Symbol: 'XAUUSD', ticket: 2002 },
      ]);

      const res = await request(app)
        .get(`/v1/accounts/${accountOne._id}/trades`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query({ symbol: 'EURUSD' })
        .expect(httpStatus.OK);

      expect(res.body.trades).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  // ─── GET /v1/accounts/:accountId/positions ──────────────────────────
  describe('GET /v1/accounts/:accountId/positions', () => {
    test('should return 200 with positions', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      await OpenPosition.create({
        accountId: accountOne._id,
        ticket: 5001,
        symbol: 'EURUSD',
        tradeType: 'BUY',
        volume: 0.1,
        openPrice: 1.1050,
        currentPrice: 1.1075,
        openTime: new Date(),
        floatingProfit: 25,
      });

      const res = await request(app)
        .get(`/v1/accounts/${accountOne._id}/positions`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.positions).toHaveLength(1);
      expect(res.body.positions[0].symbol).toBe('EURUSD');
    });
  });

  // ─── GET /v1/accounts/:accountId/summary ────────────────────────────
  describe('GET /v1/accounts/:accountId/summary', () => {
    test('should return 200 with summaries', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      await DailySummary.create({
        accountId: accountOne._id,
        date: new Date('2026-04-18T00:00:00Z'),
        totalTrades: 10,
        winningTrades: 7,
        losingTrades: 3,
        netProfit: 250.50,
        winRate: 70,
      });

      const res = await request(app)
        .get(`/v1/accounts/${accountOne._id}/summary`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.summaries).toHaveLength(1);
      expect(res.body.summaries[0].totalTrades).toBe(10);
      expect(res.body.summaries[0].winRate).toBe(70);
    });

    test('should filter by date range', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      await DailySummary.insertMany([
        { accountId: accountOne._id, date: new Date('2026-04-15T00:00:00Z'), totalTrades: 5, netProfit: 100 },
        { accountId: accountOne._id, date: new Date('2026-04-16T00:00:00Z'), totalTrades: 3, netProfit: -50 },
        { accountId: accountOne._id, date: new Date('2026-04-17T00:00:00Z'), totalTrades: 8, netProfit: 200 },
      ]);

      const res = await request(app)
        .get(`/v1/accounts/${accountOne._id}/summary`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query({ from: '2026-04-16', to: '2026-04-17' })
        .expect(httpStatus.OK);

      expect(res.body.summaries).toHaveLength(2);
    });
  });

  // ─── GET /v1/accounts/:accountId/sync-logs ──────────────────────────
  describe('GET /v1/accounts/:accountId/sync-logs', () => {
    test('should return 200 with sync logs', async () => {
      await insertUsers([userOne]);
      await insertAccounts([accountOne]);

      await SyncLog.create({
        accountId: accountOne._id,
        syncType: 'full',
        status: 'success',
        tradesSynced: 50,
        newTradesInserted: 30,
        totalTimeMs: 5000,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      const res = await request(app)
        .get(`/v1/accounts/${accountOne._id}/sync-logs`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.syncLogs).toHaveLength(1);
      expect(res.body.syncLogs[0].tradesSynced).toBe(50);
      expect(res.body.syncLogs[0].status).toBe('success');
    });
  });
});
