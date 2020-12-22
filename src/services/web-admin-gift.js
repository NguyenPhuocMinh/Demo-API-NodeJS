'use strict';

const winrow = require('winrow');
winrow.require('moment-timezone');
const Promise = winrow.require('bluebird');
const lodash = winrow.require('lodash');
const moment = winrow.require('moment');
const constant = require('../utils/constant');
const errorCodes = require('../../config/dev/errorCodes');
const { isEmpty } = lodash;

function GiftService(params = {}) {
  const { dataStore, returnCodes } = params;
  // Create Gift
  this.createGift = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    args = addFieldForAuditing(args, 'create');
    return checkDuplicateSlug(args.slug)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateSlugGift'));
        }
        return dataStore.create({
          type: 'GiftModel',
          data: args
        })
          .then(gift => convertGiftResponse(gift))
          .catch(err => {
            loggingFactory.error(`function createGift has error: ${err}`, { requestId: `${requestId}` });
            return Promise.reject(err);
          });
      })
  };
  // Get Gifts
  this.getGifts = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const params = args.params;
    const skip = parseInt(params._start) || constant.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constant.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    loggingFactory.debug(`function getGifts begin`, {
      requestId: `${requestId}`
    })
    return dataStore.find({
      type: 'GiftModel',
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
      }
    })
      .then(gifts => convertGetGifts(gifts))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return dataStore.count({
          type: 'GiftModel',
          filter: query
        })
      })
      .then(total => {
        response.total = total;
        loggingFactory.debug(`function getGifts end`, {
          requestId: `${requestId}`
        })
        return response;
      })
      .catch(err => {
        loggingFactory.error(`function getGifts has error : ${err}`, {
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      })
  };
  // Get By Id Gift
  this.getByIdGift = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const giftId = args.id;
    return dataStore.get({
      type: 'GiftModel',
      id: giftId
    })
      .then(gift => convertGiftResponse(gift))
      .catch(err => {
        loggingFactory.error(`function getByIdGift has error : ${err}`, {
          requestId: `${requestId}`
        })
        return Promise.reject(err);
      })
  };
  // Update Gift
  this.updateGift = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const giftId = args.id;
    args = addFieldForAuditing(args);
    loggingFactory.error(`function updateGift begin : ${args.id}`, {
      requestId: `${requestId}`
    })
    return checkDuplicateSlug(args.slug, giftId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            return Promise.reject(returnCodes(errorCodes, 'duplicateGift'));
          }
        }
        return dataStore.update({
          type: 'GiftModel',
          id: giftId,
          data: args
        })
          .then(gift => convertGiftResponse(gift))
          .catch(err => {
            loggingFactory.error(`function updateGift has error : ${err}`, {
              requestId: `${requestId}`
            })
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
    type: 'GiftModel',
    filter: {
      _id: { $ne: id },
      slug: slug,
    }
  }).then(result => result >= 1 ? true : false)
}

function convertGetGifts(gifts) {
  return Promise.map(
    gifts,
    gift => {
      return convertGiftResponse(gift);
    },
    { concurrency: 5 }
  );
};

function convertGiftResponse(gift) {
  if (!isEmpty(gift)) {
    gift = gift.toJSON();
    gift.id = gift._id;
    delete gift._id;
    return gift;
  } else {
    return Promise.resolve();
  }
};

function createFindQuery(params) {
  const { q, activated } = params;
  const query = {
    $and: [
      {
        deleted: false
      },
    ]
  }

  if (!isEmpty(q)) {
    query["$and"] = [];
    let subQuerySearch = { $or: [] };
    let searchProperties = ["slug"];
    searchProperties.forEach(function (property) {
      let searchCondition = {};
      searchCondition[property] = { $regex: slugifyString(q), $options: "i" };
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

exports = module.exports = new GiftService();
exports.init = GiftService;
