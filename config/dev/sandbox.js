'use strict';

const mappings = require('../../src/mappings');

module.exports = {
  application: {
    pathServer: '/rest/api',
    enable: false,
    data_ssl: {
      port: 443,
      host: 'exampledomain.com'
    },
    bridge: {
      database_local: {
        host: 'localhost',
        port: '27017',
        name: 'demoWhey',
      },
      database_server: {
        host: 'localhost',
        port: '27017',
        name: 'demo',
      }
    },
    mappings: mappings
  },
}