'use strict';

const webServer = require('winrow');
require('winrow').momentTimezone;
const {
  Promise,
  lodash,
  moment,
  loggingFactory,
  slugifyString,
  returnCodes
} = webServer;
const dataStore = require('winrow-repository').dataStore;
const constant = require('../utils/constant');
const errorCodes = require('../../config/dev/errorCodes');
const { isEmpty } = lodash;

function SmellService() {
  // Create Smell
  this.createSmell = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    args = addFieldForAuditing(args, 'create');
    loggingFactory.debug(`function createSmell begin`, { requestId: `${requestId}` })
    return checkDuplicateSlug(args.slug)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateSlugSmell'));
        }
        return dataStore.create({
          type: 'SmellModel',
          data: args
        })
          .then(smell => convertSmellResponse(smell))
          .catch(err => {
            loggingFactory.error(`function createSmell has error: : ${err}`, {
              requestId: `${requestId}`
            });
            return Promise.reject(err);
          });
      })
  };
  // Get Smells
  this.getSmells = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const params = args.params;
    const skip = parseInt(params._start) || constant.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constant.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    loggingFactory.debug(`function getSmells begin`, { requestId: `${requestId}` });
    return dataStore.find({
      type: 'SmellModel',
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
      .then(smells => convertGetSmells(smells))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return dataStore.count({
          type: 'SmellModel',
          filter: query
        })
      })
      .then(total => {
        response.total = total;
        loggingFactory.debug(`function getSmells end`, { requestId: `${requestId}` });
        return response;
      })
      .catch(err => {
        loggingFactory.error(`Get Product Type Error : ${err}`, {
          requestId: `${requestId}`
        });
        return Promise.reject(err);
      })
  };
  // Get By Id Smell
  this.getByIdSmell = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const smellId = args.id;
    loggingFactory.debug(`function getByIdSmell begin : ${args.id}`, {
      requestId: `${requestId}`
    })
    return dataStore.get({
      type: 'SmellModel',
      id: smellId
    })
      .then(smell => convertSmellResponse(smell))
      .catch(err => {
        loggingFactory.error(`function getByIdSmell has error : ${err}`, {
          requestId: `${requestId}`
        });
        return Promise.reject(err);
      })
  };
  // Update Smell
  this.updateSmell = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const smellId = args.id;
    args = addFieldForAuditing(args);
    loggingFactory.debug(`function updateSmell begin : ${args.id}`, {
      requestId: `${requestId}`
    })
    return checkDuplicateSlug(args.slug, smellId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            return Promise.reject(returnCodes(errorCodes, 'duplicateSmell'));
          }
        }
        return dataStore.update({
          type: 'SmellModel',
          id: smellId,
          data: args
        })
          .then(smell => convertSmellResponse(smell))
          .catch(err => {
            loggingFactory.debug(`function updateSmell has error : ${err}`, {
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
    type: 'SmellModel',
    filter: {
      _id: { $ne: id },
      slug: slug,
    }
  }).then(result => result >= 1 ? true : false)
}

function convertGetSmells(smells) {
  return Promise.map(
    smells,
    smell => {
      return convertSmellResponse(smell);
    },
    { concurrency: 5 }
  );
};

function convertSmellResponse(smell) {
  if (!isEmpty(smell)) {
    smell = smell.toJSON();
    smell.id = smell._id;
    delete smell._id;
    return smell;
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

module.exports = new SmellService();