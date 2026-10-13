const mongoose = require('mongoose');

// Majority, journaled writes so an acknowledged operation survives a restart (SRS NFR-05).
async function connect(uri) {
  await mongoose.connect(uri, { writeConcern: { w: 'majority', j: true } });
  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect };
