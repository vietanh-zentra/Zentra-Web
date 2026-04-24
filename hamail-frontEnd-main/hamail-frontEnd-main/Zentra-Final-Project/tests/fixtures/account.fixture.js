const mongoose = require('mongoose');
const { Account } = require('../../src/models');
const { userOne, userTwo } = require('./user.fixture');

const accountOne = {
  _id: mongoose.Types.ObjectId(),
  userId: userOne._id,
  accountId: '12345678',
  brokerServer: 'MetaQuotes-Demo',
  company: 'MetaQuotes Ltd.',
  accountName: 'Test Account One',
  balance: 10000,
  equity: 10500,
  currency: 'USD',
  leverage: 100,
  margin: 0,
  isConnected: true,
  lastSync: new Date('2026-04-18T10:00:00Z'),
  totalTradesSynced: 50,
};

const accountTwo = {
  _id: mongoose.Types.ObjectId(),
  userId: userOne._id,
  accountId: '87654321',
  brokerServer: 'ICMarkets-Live',
  company: 'IC Markets',
  accountName: 'Test Account Two',
  balance: 5000,
  equity: 4800,
  currency: 'USD',
  leverage: 200,
  margin: 100,
  isConnected: false,
  lastSync: null,
  totalTradesSynced: 0,
};

const accountThree = {
  _id: mongoose.Types.ObjectId(),
  userId: userTwo._id,
  accountId: '99999999',
  brokerServer: 'Exness-Real',
  company: 'Exness',
  accountName: 'User Two Account',
  balance: 20000,
  equity: 21000,
  currency: 'EUR',
  leverage: 500,
  margin: 0,
  isConnected: true,
  lastSync: new Date('2026-04-17T15:00:00Z'),
  totalTradesSynced: 100,
};

const insertAccounts = async (accounts) => {
  await Account.insertMany(accounts);
};

module.exports = {
  accountOne,
  accountTwo,
  accountThree,
  insertAccounts,
};
