'use strict';

const winrow = require('winrow');
winrow.require('moment-timezone');
const slugifyString = winrow.slugifyString;
const Promise = winrow.require('bluebird');
const lodash = winrow.require('lodash');
const moment = winrow.require('moment');
const constants = require('../utils/constant');
const errorCodes = require('../../config/dev/errorCodes');
const { isEmpty, get } = lodash;

function ProductService(params = {}) {
  const { dataStore, returnCodes } = params;
  // Create Product
  this.createProduct = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    args = addFieldForAuditing(args, 'create');
    loggingFactory.debug(`function createProduct`, {
      requestId: `${requestId}`
    });
    return checkDuplicateSlug(args.slug)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateSlugProduct'));
        }
        return dataStore.create({
          type: 'ProductModel',
          data: args
        })
          .then(product => convertProductResponse(product))
          .catch(err => {
            loggingFactory.error(`function createProduct Has Error : ${err}`, {
              requestId: `${requestId}`
            });
            return Promise.reject(err);
          });
      })
  };
  // Get Products
  this.getProducts = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const params = args.params;
    const skip = parseInt(params._start) || constants.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constants.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    loggingFactory.debug(`function getProducts`, { requestId: `${requestId}` });
    return dataStore.find({
      type: 'ProductModel',
      filter: query,
      projection: {
        createdAt: 0,
        createdBy: 0,
        updatedAt: 0,
        updatedBy: 0
      },
      options: {
        sort: sort,
        skip: skip,
        limit: limit
      },
    })
      .then(products => convertGetProducts(products))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return dataStore.count({
          type: 'ProductModel',
          filter: query
        })
      })
      .then(total => {
        response.total = total;
        loggingFactory.info(`function getProducts end`, {
          requestId: `${requestId}`
        });
        return response;
      })
      .catch(err => {
        loggingFactory.error(`function getProducts has error : ${err}`, {
          requestId: `${requestId}`
        });
        return Promise.reject(err);
      })
  };
  // Get By Id Product
  this.getByIdProduct = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const productId = args.id;
    loggingFactory.debug(`function getByIdProduct begin`, {
      requestId: `${requestId}`
    });
    return dataStore.get({
      type: 'ProductModel',
      id: productId
    })
      .then(product => convertProductResponse(product))
      .catch(err => {
        loggingFactory.error(`function getByIdProduct has error : ${err}`, {
          requestId: `${requestId}`
        });
        return Promise.reject(err);
      })
  };
  // Update Product
  this.updateProduct = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const productId = args.id;
    args = addFieldForAuditing(args);
    loggingFactory.debug(`function updateProduct begin`, {
      requestId: `${requestId}`
    });
    return checkDuplicateSlug(args.slug, productId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            return Promise.reject(returnCodes(errorCodes, 'DuplicateSlugProduct'));
          }
        }
        return dataStore.update({
          type: 'ProductModel',
          id: productId,
          data: args
        })
          .then(product => convertProductResponse(product))
          .catch(err => {
            loggingFactory.error(`function updateProduct has error : ${err} `, { requestId: requestId });
            return Promise.reject(err);
          })
      })
  };
};

function addFieldForAuditing(args, action) {
  const timezone = constants.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  if (action === 'create') {
    args.createdAt = nowMoment;
    args.createdBy = 'SYSTEMS';
    args.updatedAt = nowMoment;
    args.updatedBy = 'SYSTEMS';
  }

  args.updatedAt = nowMoment;
  args.updatedBy = 'SYSTEMS';

  return args;
}

function checkDuplicateSlug(slug, id) {
  return dataStore.count({
    type: 'ProductModel',
    filter: {
      _id: { $ne: id },
      slug: slug,
    }
  }).then(result => result >= 1 ? true : false)
}

function convertGetProducts(products) {
  return Promise.map(
    products,
    product => {
      return convertProductResponse(product);
    },
    { concurrency: 5 }
  );
};

function convertProductResponse(product) {
  if (!isEmpty(product)) {
    product = product.toJSON();
    product.id = product._id;
    delete product._id;
    return product;
  } else {
    return Promise.resolve();
  }
};

function createFindQuery(params) {
  let q = params.q;
  const { activated } = params;
  const query = {
    $and: [
      {
        deleted: false
      },
    ]
  }

  if (!isEmpty(q)) {
    q = slugifyString(q);
    query["$and"] = [];
    let subQuerySearch = { $or: [] };
    let searchProperties = ["slug"];
    searchProperties.forEach(function (property) {
      let searchCondition = {};
      searchCondition[property] = { $regex: q, $options: "i" };
      subQuerySearch["$or"].push(searchCondition);
    });
    query["$and"].push(subQuerySearch);
  };

  if (activated) {
    query['$and'].push({ activated: activated })
  }

  return query;
};

function createSortQuery(params) {
  let { _sort, _order } = params;
  let sortProperty = lodash.isEmpty(_sort) ? "slug" : _sort;
  let sortValue = _order === "DESC" ? -1 : 1;
  let jsonStringSort = '{ "' + sortProperty + '":' + sortValue + "}";
  return JSON.parse(jsonStringSort);
};

exports = module.exports = new ProductService();
exports.init = ProductService;