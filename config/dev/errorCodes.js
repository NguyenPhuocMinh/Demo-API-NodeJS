'use strict';

const lodash = require('web-server').lodash;
const { get, eq } = lodash;

const errorCodes = [
  {
    nameCode: 'DuplicateProviderName',
    messageCode: 'Name of provider is duplicated',
    returnCode: 3001,
    statusCode: 400,
  },
]

const returnCodes = (name = '') => {
  const error = {};
  errorCodes.map(errorCode => {
    const nameCode = get(errorCode, 'nameCode');
    const messageCode = get(errorCode, 'messageCode');
    const returnCode = get(errorCode, 'returnCode');
    const statusCode = get(errorCode, 'statusCode');
    if (eq(nameCode, name)) {
      error.nameCode = nameCode;
      error.messageCode = messageCode;
      error.returnCode = returnCode;
      error.statusCode = statusCode;
    }
  })
  return error;
}

module.exports = returnCodes;