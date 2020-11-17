'use strict';

const winrow = require('winrow');
const { Promise, lodash, getRequestId } = winrow;
const getModel = require('../config/getModel');
const loggingFactory = require('winrow-logger');
const { isEmpty } = lodash;
const { name } = require('../package.json');

function DataStore() {
  const requestId = getRequestId();
  // findOne
  this.findOne = function ({ type, filter = {}, projection = {}, populates = [] }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    if (!isEmpty(populates)) {
      return model.findOne(filter, projection)
        .then(docs => model.populate(docs, populates))
        .then(result => result)
        .catch(err => {
          loggingFactory.error(`FindOne with populates has error : ${err} `, {
            labelName: `[${name}]`,
            requestId: `${requestId}`
          })
          return Promise.reject(err);
        })
    }
    return model.findOne(filter, projection)
      .then(docs => docs)
      .catch(err => {
        loggingFactory.error(`FindOne with populates has error ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      })
  };
  // count
  this.count = function ({ type, filter = {} }) {
    loggingFactory.warn(`Model name : ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    return model.countDocuments(filter).exec();
  };
  // create
  this.create = function ({ type, data }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    const doc = new model(data)
    return model.create(doc)
      .then(result => result)
      .catch(err => {
        loggingFactory.error(`Create has error : ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        })
        return Promise.reject(err)
      })
  };
  // find
  this.find = function ({ type, filter = {}, projection = {}, options = {}, populates = [] }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    if (!isEmpty(populates)) {
      return model.find(filter, projection, options)
        .then(docs => model.populate(docs, populates))
        .catch(err => {
          loggingFactory.error(`Find has error : ${err} `, {
            labelName: `[${name}]`,
            requestId: `${requestId}`
          })
          return Promise.reject(err)
        })
    }
    return model.find(filter, projection, options).exec();
  };
  // get
  this.get = function ({ type, id, projection = {}, populates }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    if (isEmpty(id)) {
      throw new Error('IdNotFound');
    }
    if (!isEmpty(populates)) {
      return model.findById(id, projection)
        .then(docs => model.populate(docs, populates))
        .catch(err => {
          loggingFactory.error(`Get has error : ${err}`, {
            labelName: `[${name}]`,
            requestId: `${requestId}`
          })
          return Promise.reject(err)
        })
    }
    return model.findById(id, projection).exec();
  };
  // update
  this.update = function ({ type, id, data }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    if (isEmpty(id)) {
      throw new Error('IdNotFound');
    }
    return model.findByIdAndUpdate(id, data, { new: true }).exec()
      .then(docs => docs)
      .catch(err => {
        loggingFactory.error(`Update has error : ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      });
  };
  // updateOne
  this.updateOne = function ({ type, id, data }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    if (isEmpty(id)) {
      throw new Error('IdNotFound');
    }
    return model.updateOne({ _id: id }, data).exec()
      .then(docs => docs)
      .catch(err => {
        loggingFactory.error(`UpdateOne has error : ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      })
  };
  // updateMany
  this.updateMany = function ({ type, filter, data = {} }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    return model.updateMany(filter, data).exec();
  }
  // aggregate
  this.aggregate = function ({ type, pipeline }) {
    loggingFactory.warn(`Model name: ${type}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    return model.aggregate(pipeline)
      .exec()
      .then(docs => docs)
      .catch(err => {
        loggingFactory.error(`Aggregate has error : ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      })
  };
  // deleted
  this.deleted = function ({ type, id }) {
    loggingFactory.warn(`Model name: ${type}`, `${id}`, {
      labelName: `[${name}]`,
      requestId: `${requestId}`
    })
    const model = getModel(type);
    if (isEmpty(id)) {
      throw new Error('IdNotFound');
    }
    return model.findByIdAndRemove(id).exec()
      .then(docs => docs)
      .catch(err => {
        loggingFactory.error(`deleted has error : ${err}`, {
          labelName: `[${name}]`,
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      })
  };
};

module.exports = new DataStore();