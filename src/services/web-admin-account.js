'use strict';

const Promise = require('web-server').Promise;
const lodash = require('web-server').lodash;
const Account = require('modeller').AccountModel;
const bcrypt = require('bcryptjs');
const moment = require('web-server').moment;
require('web-server').momentTimezone;
const constant = require('../utils/constant');
const loggingFactory = require('web-server').loggingFactory;
const slugifyString = require('web-server').slugifyString;
const {
  returnErrorCodes,
  duplicateSlugAccount
} = require('../../config/dev/returnErrorCodes');
const { isEmpty, get } = lodash;

function AccountService() {
  const timezone = constant.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // Create Account
  this.createAccount = async function (req, res) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const slug = slugifyString(req.body.userName);

    const account = new Account({
      userName: req.body.userName,
      password: hashPassword,
      rank: req.body.rank,
      price: req.body.price,
      hero: req.body.hero,
      gold: req.body.gold,
      skin: req.body.skin,
      pearl_points: req.body.pearl_points,
      status: req.body.status,
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
          return res.status(400).send(returnErrorCodes(duplicateSlugAccount));
        }
        return Promise.resolve(account)
          .then(account => convertAccountResponse(account))
          .then(result => res.send(result))
          .then(() => account.save())
          .catch(err => {
            loggingFactory.error('Create Account Error:', JSON.stringify(err, null, 2));
            return Promise.reject(err);
          });
      })
  };
  // Get Accounts
  this.getAccounts = function (req, res) {
    const params = req.query;
    const skip = parseInt(params._start) || constant.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constant.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    return Account.find(query, {
      createdAt: 0,
      createdBy: 0,
      updatedAt: 0,
      updatedBy: 0
    },
      {
        sort: sort, skip: skip, limit: limit
      }
    )
      .then(accounts => convertGetAccounts(accounts))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return Account.countDocuments(query)
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
  // Get By Id Account
  this.getByIdAccount = function (req, res) {
    const accountId = req.params.id;
    return Account.findById({ _id: accountId })
      .then(account => convertAccountResponse(account))
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error("Get By Id Error", err);
        return Promise.reject(err);
      })
  };
  // Update Account
  this.updateAccount = async function (req, res) {
    const thumbnail = req.body.thumbnail;
    const thumbnailBase64 = get(thumbnail, 'src');

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const slug = slugifyString(req.body.userName)
    const accountId = req.params.id;

    return checkDuplicateSlug(slug, accountId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            loggingFactory.info('duplicate', duplicate);
            return res.status(400).send(returnErrorCodes(duplicateSlugAccount));
          }
        }
        return Account.findByIdAndUpdate(
          { _id: accountId },
          {
            userName: req.body.userName,
            password: hashPassword,
            rank: req.body.rank,
            price: req.body.price,
            hero: req.body.hero,
            gold: req.body.gold,
            skin: req.body.skin,
            pearl_points: req.body.pearl_points,
            thumbnail: thumbnailBase64,
            status: req.body.status,
            activated: req.body.activated,
            slug: slug,
            updatedAt: nowMoment,
            updatedBy: 'SYSTEMS'
          },
          { new: true }
        )
          .then(account => convertAccountResponse(account))
          .then(result => res.send(result))
          .catch(err => {
            loggingFactory.error("Update Account Error ", err);
            return Promise.reject(err);
          })
      })
  };
};

function checkDuplicateSlug(slug, id) {
  return Account.countDocuments({
    _id: { $ne: id },
    slug: slug
  }).then(result => result >= 1 ? true : false)
}

function convertGetAccounts(accounts) {
  return Promise.map(
    accounts,
    account => {
      return convertAccountResponse(account);
    },
    { concurrency: 5 }
  );
};

function convertAccountResponse(account) {
  if (!isEmpty(account)) {
    account = account.toJSON();
    account.id = account._id;
    delete account._id;
    return account;
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

module.exports = new AccountService();