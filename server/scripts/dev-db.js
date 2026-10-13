// Starts a local single-node MongoDB replica set for development, so you don't
// need to install MongoDB. A replica set is needed for transactions (SAD ADR-02).
// Usage: npm run dev:db   (then set MONGODB_URI in server/.env to the printed URI)
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

async function main() {
  const dbPath = path.join(__dirname, '..', '.dev-db');
  fs.mkdirSync(dbPath, { recursive: true });
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ port: 27017, dbPath }],
  });
  const uri = replSet.getUri('vps');
  console.log(`MongoDB dev replica set running.\nMONGODB_URI=${uri}\nPress Ctrl+C to stop (data is kept in server/.dev-db).`);
  const stop = async () => { await replSet.stop({ doCleanup: false }); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
