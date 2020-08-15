'use strict';

const server = require('web-server');
const mappings = require('./src/mappings/index');

if (require.main === module) {
  server.mappingApi(mappings);
  server.start();
  // server.repository();
  const stopped = function () {
    server.stop();
  };
  process.on('SIGINT', stopped);
  process.on('SIGQUIT', stopped);
  process.on('SIGTERM', stopped);
}
