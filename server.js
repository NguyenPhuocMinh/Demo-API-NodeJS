'use strict';

const winrow = require('winrow');
const repository = require('winrow-repository');
const transform = require('winrow-transform');
const sandbox = require('./config/dev/sandbox');

if (require.main === module) {
  winrow.start(sandbox);
  repository.connect(sandbox);
  transform.mapping(sandbox);
  require('modeller');
  const stopped = function () {
    winrow.stop();
    repository.disconnect(sandbox);
  };
  process.on('SIGINT', stopped);
  process.on('SIGQUIT', stopped);
  process.on('SIGTERM', stopped);
}
