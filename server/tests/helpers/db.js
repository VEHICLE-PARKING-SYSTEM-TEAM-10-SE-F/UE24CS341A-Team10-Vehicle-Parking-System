// Test database: an in-memory MongoDB replica set, so transactions work in tests and CI.
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connect, disconnect } = require('../../src/db');

let replSet;

async function startDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await connect(replSet.getUri('vps-test'));
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

async function clearDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function stopDb() {
  await disconnect();
  if (replSet) await replSet.stop();
}

module.exports = { startDb, clearDb, stopDb };
