'use strict';

const winrow = require('winrow');
const { mongoose, lodash, getRequestId } = winrow;
const dataStore = require('./dataStore');
const loggingFactory = require('winrow-logger');
const { get } = lodash;
const { name, version } = require('../package.json');

function Repository() {
  const requestId = getRequestId();
  // connect mongoose
  this.connect = function (sandbox) {
    const enable = get(sandbox, 'application.enable');
    const database_server = get(sandbox, 'application.bridge.database_server');
    const database_local = get(sandbox, 'application.bridge.database_local');
    let host = get(database_server, 'host');
    let port = get(database_server, 'port');
    let named_db = get(database_server, 'name');
    if (!enable) {
      host = get(database_local, 'host');
      port = get(database_local, 'port');
      named_db = get(database_local, 'name');
    }
    const db_url = `mongodb://${host}:${port}/${named_db}`;
    return new Promise((resolve, reject) => {
      const connect = mongoose.connect(db_url, { useNewUrlParser: true }, (err) => {
        if (!err) {
          loggingFactory.data(`The mongoose connect complete ${db_url}`, {
            labelName: `[${name}]`,
            requestId: `${requestId}`
          });
        } else {
          console.info(`Database is not connected`, err);
          reject(err);
        }
      })
      resolve(connect);
    })
      .then(info => {
        loggingFactory.info(`Connect library ${name} version : ${version} has been complete`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        });
        return info;
      })
      .catch(err => {
        loggingFactory.error(`The Database Has Error : ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        });
        return Promise.reject(err)
      })
  };
  // disconnect mongoose
  this.disconnect = function (sandbox) {
    const enable = get(sandbox, 'application.enable');
    const database_server = get(sandbox, 'application.bridge.database_server');
    const database_local = get(sandbox, 'application.bridge.database_local');
    let host = get(database_server, 'host');
    let port = get(database_server, 'port');
    let named_db = get(database_server, 'name');
    if (!enable) {
      host = get(database_local, 'host');
      port = get(database_local, 'port');
      named_db = get(database_local, 'name');
    }
    const db_url = `mongodb://${host}:${port}/${named_db}`;
    return new Promise(function (resolve, reject) {
      const disconnect = mongoose.connection.close((err) => {
        if (err) {
          loggingFactory.error(`Disconnection mongoose has error : ${err}`, {
            labelName: `[${name}]`,
            requestId: `${requestId}`
          });
          reject(err);
        } else {
          loggingFactory.data(`Mongoose disconnect ${db_url}`, {
            labelName: `[${name}]`,
            requestId: `${requestId}`
          });
        }
      })
      resolve(disconnect)
    })
      .then(() => {
        loggingFactory.data(`Mongoose ${db_url} has been closed`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        });
        loggingFactory.debug(`Disconnect library ${name} version : ${version}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        });
        process.exit(0);
      })
      .catch(err => {
        loggingFactory.error(`Disconnection mongoose has error : ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      })
  }
  // get dataStore
  this.dataStore = dataStore;

};

module.exports = new Repository();