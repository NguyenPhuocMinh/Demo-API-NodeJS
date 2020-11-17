'use strict';

const winrow = require('winrow');
require('winrow').momentTimezone;
const {
  Promise,
  lodash,
  moment,
  slugifyString,
  returnCodes
} = winrow;
const dataStore = require('winrow-repository').dataStore;
const ProductType = require('modeller').ProductTypeModel;
const constant = require('../utils/constant');
const errorCodes = require('../../config/dev/errorCodes');
const { isEmpty, isNil } = lodash;

function ProductTypeService() {
  const timezone = constant.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // Create Product Type
  this.createProductType = async function (args, opts) {
    const { loggingFactory, requestId } = opts;

    args.createdAt = nowMoment;
    args.createdBy = 'SYSTEMS';
    args.updatedAt = nowMoment;
    args.updatedBy = 'SYSTEMS';

    return checkDuplicateSlug(args.slug)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateSlugProductType'));
        }
        return dataStore.create({
          type: 'ProductTypeModel',
          data: args
        })
          .then(productType => convertProductTypeResponse(productType))
          .catch(err => {
            loggingFactory.error(`Create Product Type Error: ${err}`, { requestId: `${requestId}` });
            return Promise.reject(err);
          });
      })
  };
  // Get productTypes
  this.getProductTypes = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const params = args.params;
    const skip = parseInt(params._start) || constant.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constant.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    return dataStore.find({
      type: 'ProductTypeModel',
      filter: query,
      projections: {
        createdAt: 0,
        createdBy: 0,
        updatedAt: 0,
        updatedBy: 0
      },
      options: {
        sort: sort,
        skip: skip,
        limit: limit
      }
    })
      .then(productTypes => convertGetProductTypes(productTypes))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return dataStore.count({
          type: 'ProductTypeModel',
          filter: query
        })
      })
      .then(total => {
        response.total = total;
        return response;
      })
      .catch(err => {
        loggingFactory.error(`Get Product Type Error : ${err}`, { requestId: requestId });
        return Promise.reject(err);
      })
  };
  // Get By Id ProductType
  this.getByIdProductType = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const productTypeId = args.id;
    return dataStore.get({
      type: 'ProductTypeModel',
      id: productTypeId
    })
      .then(ProductType => convertProductTypeResponse(ProductType))
      .catch(err => {
        loggingFactory.error(`Get By Id Error : ${err}`, { requestId: `${requestId}` });
        return Promise.reject(err);
      })
  };
  // Update ProductType
  this.updateProductType = async function (args, opts) {
    const { loggingFactory, requestId } = opts;

    args.updatedAt = nowMoment;
    args.updatedBy = 'SYSTEMS';

    const productTypeId = args.id;
    return checkDuplicateSlug(args.slug, productTypeId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            return Promise.reject(returnCodes(errorCodes, 'DuplicateProductType'));
          }
        }
        return dataStore.update({
          type: 'ProductTypeModel',
          id: productTypeId,
          data: args
        })
          .then(productType => convertProductTypeResponse(productType))
          .catch(err => {
            loggingFactory.error(`Update Product Type Error : ${err}`, { requestId: `${requestId}` });
            return Promise.reject(err);
          })
      })
  };
};

function checkDuplicateSlug(slug, id) {
  return dataStore.count({
    type: 'ProductTypeModel',
    filter: {
      _id: { $ne: id },
      slug: slug,
    }
  }).then(result => result >= 1 ? true : false)
}

function convertGetProductTypes(productTypes) {
  return Promise.map(
    productTypes,
    productType => {
      return convertProductTypeResponse(productType);
    },
    { concurrency: 5 }
  );
};

function convertProductTypeResponse(productType) {
  if (!isEmpty(productType)) {
    productType = productType.toJSON();
    productType.id = productType._id;
    delete productType._id;
    return productType;
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

module.exports = new ProductTypeService();