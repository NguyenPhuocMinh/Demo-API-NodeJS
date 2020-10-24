'use strict';

const webServer = require('web-server-node');
require('web-server-node').momentTimezone;
const {
  Promise,
  lodash,
  moment,
  loggingFactory,
  slugifyString
} = webServer;
const ProductType = require('modeller').ProductTypeModel;
const constant = require('../utils/constant');
const returnCodes = require('../../config/dev/errorCodes');
const { isEmpty, isNil } = lodash;

function ProductTypeService() {
  const timezone = constant.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // Create Product Type
  this.createProductType = async function (req, res) {
    const slug = slugifyString(req.body.name);
    const productType = new ProductType({
      name: req.body.name,
      activated: req.body.activated,
      slug: slug,
      createdAt: nowMoment,
      createdBy: 'SYSTEMS',
      updatedAt: nowMoment,
      updatedBy: 'SYSTEMS'
    })
    return checkDuplicateSlug(slug)
      .then(duplicate => {
        if (duplicate) {
          loggingFactory.info('duplicate', duplicate);
          return res.status(400).send(returnCodes('DuplicateSlugProductType'));
        }
        return Promise.resolve(productType)
          .then(productType => convertProductTypeResponse(productType))
          .then(result => res.send(result))
          .then(() => productType.save())
          .catch(err => {
            loggingFactory.error('Create Product Type Error:', JSON.stringify(err, null, 2));
            return Promise.reject(err);
          });
      })
  };
  // Get productTypes
  this.getProductTypes = function (req, res) {
    const params = req.query;
    const skip = parseInt(params._start) || constant.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constant.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    return ProductType.find(query, {
      createdAt: 0,
      createdBy: 0,
      updatedAt: 0,
      updatedBy: 0
    },
      {
        sort: sort, skip: skip, limit: limit
      }
    )
      .then(productTypes => convertGetProductTypes(productTypes))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return ProductType.countDocuments(query)
      })
      .then(total => {
        response.total = total;
        return response;
      })
      .then(() => {
        res
          .header("X-Total-Count", response.total)
          .header("Access-Control-Expose-Headers", "X-Total-Count")
          .send(response.data)
      })
      .catch(err => {
        loggingFactory.error('Get Product Type Error', err);
        return Promise.reject(err);
      })
  };
  // Get By Id ProductType
  this.getByIdProductType = function (req, res) {
    const productTypeId = req.params.id;
    return ProductType.findById({ _id: productTypeId })
      .then(ProductType => convertProductTypeResponse(ProductType))
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error("Get By Id Error", err);
        return Promise.reject(err);
      })
  };
  // Update ProductType
  this.updateProductType = async function (req, res) {
    const slug = slugifyString(req.body.username)
    const productTypeId = req.params.id;

    return checkDuplicateSlug(slug, productTypeId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            loggingFactory.info('duplicate', duplicate);
            return res.status(400).send(returnCodes('duplicateProductType'));
          }
        }
        return ProductType.findByIdAndUpdate(
          { _id: productTypeId },
          {
            name: req.body.name,
            activated: req.body.activated,
            slug: slug,
            updatedAt: nowMoment,
            updatedBy: 'SYSTEMS'
          },
          { new: true }
        )
          .then(productType => convertProductTypeResponse(productType))
          .then(result => res.send(result))
          .catch(err => {
            loggingFactory.error("Update Product Type Error ", err);
            return Promise.reject(err);
          })
      })
  };
};

function checkDuplicateSlug(slug, id) {
  return ProductType.countDocuments({
    _id: { $ne: id },
    slug: slug,
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