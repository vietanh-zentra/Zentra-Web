const mongoose = require('mongoose');
const { Account } = require('../../../src/models');
const setupTestDB = require('../../utils/setupTestDB');

setupTestDB();

describe('Account Model', () => {
  describe('Account validation', () => {
    let newAccount;

    beforeEach(() => {
      newAccount = {
        userId: mongoose.Types.ObjectId(),
        accountId: '12345678',
        brokerServer: 'MetaQuotes-Demo',
        company: 'MetaQuotes Ltd.',
        accountName: 'Test Account',
        balance: 10000,
        equity: 10500,
        currency: 'USD',
        leverage: 100,
      };
    });

    test('should correctly create a valid account', async () => {
      const account = new Account(newAccount);
      await expect(account.validate()).resolves.toBeUndefined();
      const savedAccount = await account.save();
      expect(savedAccount.accountId).toBe('12345678');
      expect(savedAccount.balance).toBe(10000);
      expect(savedAccount.isConnected).toBe(false);
      expect(savedAccount.totalTradesSynced).toBe(0);
      expect(savedAccount.createdAt).toBeDefined();
      expect(savedAccount.updatedAt).toBeDefined();
    });

    test('should set default values correctly', async () => {
      const minimalAccount = new Account({
        userId: mongoose.Types.ObjectId(),
        accountId: '99999999',
        brokerServer: 'Test-Server',
      });
      const saved = await minimalAccount.save();
      expect(saved.balance).toBe(0);
      expect(saved.equity).toBe(0);
      expect(saved.currency).toBe('USD');
      expect(saved.margin).toBe(0);
      expect(saved.isConnected).toBe(false);
      expect(saved.lastSync).toBeNull();
      expect(saved.totalTradesSynced).toBe(0);
    });

    test('should throw validation error if userId is missing', async () => {
      delete newAccount.userId;
      const account = new Account(newAccount);
      await expect(account.validate()).rejects.toThrow();
    });

    test('should throw validation error if accountId is missing', async () => {
      delete newAccount.accountId;
      const account = new Account(newAccount);
      await expect(account.validate()).rejects.toThrow();
    });

    test('should throw validation error if brokerServer is missing', async () => {
      delete newAccount.brokerServer;
      const account = new Account(newAccount);
      await expect(account.validate()).rejects.toThrow();
    });

    test('should enforce unique constraint on userId + accountId', async () => {
      await Account.create(newAccount);
      const duplicate = new Account(newAccount);
      await expect(duplicate.save()).rejects.toThrow();
    });

    test('should allow same accountId for different users', async () => {
      await Account.create(newAccount);
      const differentUser = { ...newAccount, _id: mongoose.Types.ObjectId(), userId: mongoose.Types.ObjectId() };
      await expect(Account.create(differentUser)).resolves.toBeDefined();
    });

    test('should apply toJSON plugin (removes __v, converts _id to id)', async () => {
      const account = await Account.create(newAccount);
      const json = account.toJSON();
      expect(json).not.toHaveProperty('__v');
      expect(json).toHaveProperty('id');
    });
  });
});
