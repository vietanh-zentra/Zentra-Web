const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://hamilghani:Teamzentra456%3F@cluster0.zblywl1.mongodb.net/?retryWrites=true&w=majority';

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected!');

  const db = client.db('zentra');
  const trades = db.collection('trades');

  const nullCount = await trades.countDocuments({ accountId: null });
  const totalCount = await trades.countDocuments();
  console.log(`Trades with accountId=null: ${nullCount}`);
  console.log(`Total trades: ${totalCount}`);

  if (nullCount > 0) {
    const r = await trades.deleteMany({ accountId: null });
    console.log(`Deleted: ${r.deletedCount} corrupt trades`);
  } else {
    console.log('No corrupt trades found');
  }

  // Also check if there are any databases/collections
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name).join(', '));

  await client.close();
  console.log('Done!');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
