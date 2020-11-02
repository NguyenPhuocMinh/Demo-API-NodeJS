'use strict';

const webServer = require('winrow');
require('winrow').momentTimezone;
const {
  Promise,
  lodash,
  moment,
  loggingFactory,
  slugifyString
} = webServer;
const Product = require('modeller').ProductModel;
const constants = require('../utils/constant');
const returnCodes = require('../../config/dev/errorCodes');
const { isEmpty, get } = lodash;

function ProductService() {
  const timezone = constants.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // Create Product
  this.createProduct = async function (req, res) {
    const slug = slugifyString(req.body.name);
    const product = new Product({
      name: req.body.name,
      weight: req.body.weight,
      smells: req.body.smells,
      gifts: req.body.gifts,
      price: req.body.price,
      productType: req.body.productType,
      quantity: req.body.quantity,
      skin: req.body.skin,
      status: req.body.status,
      slug: slug,
      activated: req.body.activated,
      createdAt: nowMoment,
      createdBy: 'SYSTEMS',
      updatedAt: nowMoment,
      updatedBy: 'SYSTEMS'
    })
    return checkDuplicateSlug(slug)
      .then(duplicate => {
        if (duplicate) {
          loggingFactory.info('duplicate', duplicate);
          return res.status(400).send(returnCodes('DuplicateSlugProduct'));
        }
        return Promise.resolve(product)
          .then(product => convertProductResponse(product))
          .then(result => res.send(result))
          .then(() => product.save())
          .catch(err => {
            loggingFactory.error('Create Product Error:', JSON.stringify(err, null, 2));
            return Promise.reject(err);
          });
      })
  };
  // Get Products
  this.getProducts = function (req, res) {
    const params = req.query;
    const skip = parseInt(params._start) || constants.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constants.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    return Product.find(query, {
      createdAt: 0,
      createdBy: 0,
      updatedAt: 0,
      updatedBy: 0
    },
      {
        sort: sort, skip: skip, limit: limit
      }
    )
      // .populate('productType', 'name')
      .then(products => convertGetProducts(products))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return Product.countDocuments(query)
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
        loggingFactory.error('Get account Error', err);
        return Promise.reject(err);
      })
  };
  // Get By Id Product
  this.getByIdProduct = function (req, res) {
    const productId = req.params.id;
    return Product
      .findById({ _id: productId })
      .then(product => convertProductResponse(product))
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error("Get By Id Error", err);
        return Promise.reject(err);
      })
  };
  // Update Product
  this.updateProduct = async function (req, res) {
    const slug = slugifyString(req.body.username)
    const productId = req.params.id;

    return checkDuplicateSlug(slug, productId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            loggingFactory.info('duplicate', duplicate);
            return res.status(400).send(returnCodes('duplicateSlugProduct'));
          }
        }
        return Product.findByIdAndUpdate(
          { _id: productId },
          {
            name: req.body.name,
            weight: req.body.weight,
            smells: req.body.smells,
            gifts: req.body.gifts,
            price: req.body.price,
            productType: req.body.productType,
            quantity: req.body.quantity,
            skin: req.body.skin,
            status: req.body.status,
            slug: slug,
            activated: req.body.activated,
            updatedAt: nowMoment,
            updatedBy: 'SYSTEMS'
          },
          { new: true }
        )
          .then(product => convertProductResponse(product))
          .then(result => res.send(result))
          .catch(err => {
            loggingFactory.error("Update Product Error ", err);
            return Promise.reject(err);
          })
      })
  };
};

function checkDuplicateSlug(slug, id) {
  return Product.countDocuments({
    _id: { $ne: id },
    slug: slug,
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

module.exports = new ProductService();