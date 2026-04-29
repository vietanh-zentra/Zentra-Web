/**
 * ZENTRA — Cleanup Script
 * Xóa trades bị lỗi (accountId: null) trong MongoDB
 * và push code fix lên GitHub.
 *
 * Chạy: node cleanup_and_deploy.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  console.error('ERROR: MONGODB_URL not found in .env');
  process.exit(1);
}

async function main() {
  console.log('='.repeat(60));
  console.log('ZENTRA — DATABASE CLEANUP');
  console.log('='.repeat(60));

  console.log('\n[1/3] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URL);
  console.log('  ✓ Connected');

  const db = mongoose.connection.db;
  const tradesCollection = db.collection('trades');

  // Count corrupt trades
  console.log('\n[2/3] Checking for corrupt trades (accountId: null)...');
  const nullCount = await tradesCollection.countDocuments({ accountId: null });
  console.log(`  Found ${nullCount} trades with accountId: null`);

  if (nullCount > 0) {
    // Delete them
    const result = await tradesCollection.deleteMany({ accountId: null });
    console.log(`  ✓ Deleted ${result.deletedCount} corrupt trades`);
  } else {
    console.log('  ○ No corrupt trades found — database is clean');
  }

  // Also check total trades
  const totalCount = await tradesCollection.countDocuments();
  console.log(`\n[3/3] Total trades remaining in database: ${totalCount}`);

  await mongoose.disconnect();
  console.log('\n✓ Database cleanup complete!');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
