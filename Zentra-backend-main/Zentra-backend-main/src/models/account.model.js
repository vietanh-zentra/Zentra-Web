const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const accountSchema = mongoose.Schema(
  {
    /** Reference to the User who owns this MT5 account */
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** MT5 account number (login) — e.g. "12345678" */
    accountId: {
      type: String,
      required: true,
      trim: true,
    },
    /** MT5 broker server name — e.g. "MetaQuotes-Demo" */
    brokerServer: {
      type: String,
      required: true,
      trim: true,
    },
    /** Broker company name — e.g. "MetaQuotes Ltd." */
    company: {
      type: String,
      required: false,
      trim: true,
    },
    /** Account holder name from MT5 */
    accountName: {
      type: String,
      required: false,
      trim: true,
    },
    /** Current account balance */
    balance: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Current account equity (balance + floating P/L) */
    equity: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Account currency — e.g. "USD", "EUR" */
    currency: {
      type: String,
      required: false,
      default: 'USD',
      trim: true,
    },
    /** Account leverage — e.g. 100, 200, 500 */
    leverage: {
      type: Number,
      required: false,
    },
    /** Account margin */
    margin: {
      type: Number,
      required: false,
      default: 0,
    },
    /** Whether the account is currently connected/active */
    isConnected: {
      type: Boolean,
      required: false,
      default: false,
    },
    /** Timestamp of the last successful sync */
    lastSync: {
      type: Date,
      required: false,
      default: null,
    },
    /** Total number of trades synced for this account */
    totalTradesSynced: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index: one user can't add the same MT5 account twice
accountSchema.index({ userId: 1, accountId: 1 }, { unique: true });
// For quick lookups by accountId alone
accountSchema.index({ accountId: 1 });

accountSchema.plugin(toJSON);
accountSchema.plugin(paginate);

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
