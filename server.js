'use strict';

const server = require('winrow');
const mappings = require('./src/mappings/index');
const sandbox = require('./config/dev/sandbox');

if (require.main === module) {
  server.start();
  server.mappingApi(mappings);
  server.repository(sandbox);
  const stopped = function () {
    server.stop();
  };
  process.on('SIGINT', stopped);
  process.on('SIGQUIT', stopped);
  process.on('SIGTERM', stopped);
}
