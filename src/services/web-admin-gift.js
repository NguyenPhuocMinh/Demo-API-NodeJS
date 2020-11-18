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
const constant = require('../utils/constant');
const errorCodes = require('../../config/dev/errorCodes');
const { isEmpty } = lodash;

function GiftService() {
  const timezone = constant.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // Create Gift
  this.createGift = async function (args, opts) {
    const { loggingFactory, requestId } = opts;

    args.createdAt = nowMoment;
    args.createdBy = 'SYSTEMS';
    args.updatedAt = nowMoment;
    args.updatedBy = 'SYSTEMS';

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
            loggingFactory.error(`Create Gift Error: ${err}`, { requestId: `${requestId}` });
            return Promise.reject(err);
          });
      })
  };
  // Get Gifts
  this.getGifts = function (req, res) {
    const params = req.query;
    const skip = parseInt(params._start) || constant.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constant.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    return Gift.find(query, {
      createdAt: 0,
      createdBy: 0,
      updatedAt: 0,
      updatedBy: 0
    },
      {
        sort: sort, skip: skip, limit: limit
      }
    )
      .then(gifts => convertGetGifts(gifts))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return Gift.countDocuments(query)
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
        loggingFactory.error('Get Gift Error', err);
        return Promise.reject(err);
      })
  };
  // Get By Id Gift
  this.getByIdGift = function (req, res) {
    const giftId = req.params.id;
    return Gift.findById({ _id: giftId })
      .then(gift => convertGiftResponse(gift))
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error("Get By Id Error", err);
        return Promise.reject(err);
      })
  };
  // Update Gift
  this.updateGift = async function (req, res) {
    const slug = slugifyString(req.body.username)
    const giftId = req.params.id;

    return checkDuplicateSlug(slug, giftId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            loggingFactory.info('duplicate', duplicate);
            return res.status(400).send(returnCodes('duplicateGift'));
          }
        }
        return Gift.findByIdAndUpdate(
          { _id: GiftId },
          {
            name: req.body.name,
            activated: req.body.activated,
            slug: slug,
            updatedAt: nowMoment,
            updatedBy: 'SYSTEMS'
          },
          { new: true }
        )
          .then(gift => convertGiftResponse(gift))
          .then(result => res.send(result))
          .catch(err => {
            loggingFactory.error("Update Gift Error ", err);
            return Promise.reject(err);
          })
      })
  };
};

function checkDuplicateSlug(slug, id) {
  return Gift.countDocuments({
    _id: { $ne: id },
    slug: slug,
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

module.exports = new GiftService();