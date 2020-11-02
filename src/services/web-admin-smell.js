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
const Smell = require('modeller').SmellModel;
const constant = require('../utils/constant');
const returnCodes = require('../../config/dev/errorCodes');
const { isEmpty } = lodash;

function SmellService() {
  const timezone = constant.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // Create Smell
  this.createSmell = async function (req, res) {
    const slug = slugifyString(req.body.name);
    const smell = new Smell({
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
          return res.status(400).send(returnCodes('DuplicateSlugSmell'));
        }
        return Promise.resolve(smell)
          .then(smell => convertSmellResponse(smell))
          .then(result => res.send(result))
          .then(() => smell.save())
          .catch(err => {
            loggingFactory.error('Create Smell Error:', JSON.stringify(err, null, 2));
            return Promise.reject(err);
          });
      })
  };
  // Get Smells
  this.getSmells = function (req, res) {
    const params = req.query;
    const skip = parseInt(params._start) || constant.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constant.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    return Smell.find(query, {
      createdAt: 0,
      createdBy: 0,
      updatedAt: 0,
      updatedBy: 0
    },
      {
        sort: sort, skip: skip, limit: limit
      }
    )
      .then(smells => convertGetSmells(smells))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return Smell.countDocuments(query)
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
  // Get By Id Smell
  this.getByIdSmell = function (req, res) {
    const smellId = req.params.id;
    return Smell.findById({ _id: smellId })
      .then(smell => convertSmellResponse(smell))
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error("Get By Id Error", err);
        return Promise.reject(err);
      })
  };
  // Update Smell
  this.updateSmell = async function (req, res) {
    const slug = slugifyString(req.body.username)
    const smellId = req.params.id;

    return checkDuplicateSlug(slug, smellId)
      .then(duplicate => {
        if (duplicate) {
          if (duplicate) {
            loggingFactory.info('duplicate', duplicate);
            return res.status(400).send(returnCodes('duplicateSmell'));
          }
        }
        return Smell.findByIdAndUpdate(
          { _id: SmellId },
          {
            name: req.body.name,
            activated: req.body.activated,
            slug: slug,
            updatedAt: nowMoment,
            updatedBy: 'SYSTEMS'
          },
          { new: true }
        )
          .then(smell => convertSmellResponse(smell))
          .then(result => res.send(result))
          .catch(err => {
            loggingFactory.error("Update Smell Error ", err);
            return Promise.reject(err);
          })
      })
  };
};

function checkDuplicateSlug(slug, id) {
  return Smell.countDocuments({
    _id: { $ne: id },
    slug: slug,
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