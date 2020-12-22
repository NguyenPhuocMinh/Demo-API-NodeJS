'use strict';

const server = require('winrow');
const sandbox = require('./config/dev/sandbox');

if (require.main === module) {
  server.init(sandbox);
  server.start();
  server.connect_mongoose();
  server.mapping();
  require('modeller')
  const stopped = function () {
    server.stop();
    server.disconnect_mongoose();
  };
  process.on('SIGINT', stopped);
  process.on('SIGQUIT', stopped);
  process.on('SIGTERM', stopped);
}
