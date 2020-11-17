'use strict';

const winrow = require('winrow');
const { lodash, mongoose } = winrow;
const { includes, isEmpty } = lodash;
const { models, modelNames } = mongoose;

function GetModel(type) {
  let model = null;
  if (includes(modelNames(), type)) {
    return model = models[type];
  }
  throw new Error('InvalidNameModel');
};

module.exports = GetModel;