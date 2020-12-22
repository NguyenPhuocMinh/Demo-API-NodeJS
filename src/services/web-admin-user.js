'use strict';

const winrow = require('winrow');
winrow.require('moment-timezone');
const Promise = winrow.require('bluebird');
const lodash = winrow.require('lodash');
const moment = winrow.require('moment');
const jwt = winrow.require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const slugifyString = winrow.slugifyString;
const constants = require('../utils/constant');
const data = require('../../config/data/secret');
const verify = require('../utils/verifyToken');
const errorCodes = require('../../config/dev/errorCodes');
const webConfig = require('../../config/dev/webConfig');
const { isEmpty, get } = lodash;
let tokenList = {};

function UserService(params = {}) {
  const { dataStore, returnCodes } = params;
  // register user
  this.registerUser = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    loggingFactory.info(JSON.stringify(args));

    args = addFieldForAuditing(args, 'create');

    loggingFactory.debug(`function registerUser begin`, { requestId: `${requestId}` });

    // Hash Password
    let password = '';
    if (isEmpty(args.password)) {
      password = '123';
    } else {
      password = args.password
    }
    const salt = await bcrypt.genSalt(10);
    args.password = await bcrypt.hash(password, salt);
    const permissions = convertPermissions(args.permissions);
    args.permissions = permissions;
    args.gender = convertGender(args.gender);

    return checkDuplicateEmail(args.email)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateEmailRegister'));
        }
        return dataStore.create({
          type: 'UserModel',
          data: args
        })
          .then(user => convertUserResponse(user))
          .catch(err => {
            loggingFactory.error(`function registerUser has error : ${err}`, { requestId: `${requestId}` });
            return Promise.reject(err);
          })
      })
  };
  // login user
  this.loginUser = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    try {
      loggingFactory.debug('function loginUser', { requestId: `${requestId}` });
      const userLogin = await dataStore.findOne({
        type: 'UserModel',
        filter: {
          email: args.email
        }
      })
      if (!userLogin) {
        return Promise.reject(returnCodes(errorCodes, 'EmailNotFound'))
      }
      const validPass = await bcrypt.compare(args.password, userLogin.password);
      if (!validPass) {
        return Promise.reject(returnCodes(errorCodes, 'InValidPassword'));
      }
      const token = jwt.sign({ userLogin }, data.secret, {
        expiresIn: data.tokenLife,
      });
      const refreshToken = jwt.sign({ userLogin }, data.refreshTokenSecret, {
        expiresIn: data.refreshTokenLife
      })
      tokenList[refreshToken] = userLogin;
      loggingFactory.debug('function loginUser end', { requestId: `${requestId}` });
      return {
        token: token,
        refreshToken: refreshToken,
        expiresIn: data.tokenLife,
        id: userLogin.id,
        name: userLogin.firstName + " " + userLogin.lastName,
        permissions: userLogin.permissions,
        webConfig: webConfig
      }
    } catch (err) {
      loggingFactory.error(`function loginUser has error : ${err}`, { requestId: `${requestId}` });
      return Promise.reject(err);
    }
  };
  // get user
  this.getUsers = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const params = args.params;
    const skip = parseInt(params._start) || constants.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constants.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    loggingFactory.debug(`function getUsers begin`, { requestId: `${requestId}` })
    return dataStore.find({
      type: 'UserModel',
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
      .then(users => convertGetUsers(users))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return dataStore.count({
          type: 'UserModel',
          filter: query
        })
      })
      .then(total => {
        response.total = total;
        loggingFactory.debug(`function getUsers end`, { requestId: `${requestId}` })
        return response;
      })
      .catch(err => {
        loggingFactory.error(`function getUsers has error : ${err}`, { requestId: `${requestId}` })
        return Promise.reject(err);
      })
  };
  // get user by id
  this.getUserById = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const userId = args.id;
    loggingFactory.debug(`function getUserById begin : ${args.id}`, { requestId: `${requestId}` });
    return dataStore.get({
      type: 'UserModel',
      id: userId
    })
      .then(user => convertUserResponse(user))
      .catch(err => {
        loggingFactory.error(`function getUserById has error : ${err}`, { requestId: `${requestId}` });
        return Promise.reject(err);
      })
  };
  // refresh token
  this.refreshTokenHandler = async function (args, opts) {
    const { loggingFactory } = opts;
    const { refreshToken } = args;
    try {
      // Kiểm tra mã Refresh token
      await verify.verifyJwtToken(refreshToken, data.refreshTokenSecret);
      // Lấy lại thông tin user
      const userLogin = tokenList[refreshToken];
      // Tạo mới mã token và trả lại cho user
      const token = await jwt.sign({ userLogin }, data.secret, {
        expiresIn: data.tokenLife,
      });
      const refreshTokenHandle = jwt.sign({ userLogin }, data.refreshTokenSecret, {
        expiresIn: data.refreshTokenLife
      })
      loggingFactory.silly('refreshTokenHandler Info:',
        [
          { 'userId': userLogin.id },
          { 'refreshToken': refreshToken },
          { 'expiresIn': data.tokenLife },
          { 'permissions': userLogin.permissions },
          { 'webConfigs': webConfigs }
        ]
      )
      return {
        token: token,
        refreshToken: refreshTokenHandle,
        expiresIn: data.tokenLife,
        id: userLogin.id,
        name: userLogin.firstName + " " + userLogin.lastName,
        permissions: userLogin.permissions,
        webConfig: webConfig
      }
    } catch (err) {
      loggingFactory.error('Refresh Token Error:', err);
      res.status(403).json({
        message: 'Invalid refresh token',
      });
    }
  };
  // change password
  this.changePassword = async function (args, opts) {
    const { loggingFactory, requestId } = opts;
    let userId = args.id;
    loggingFactory.debug(`function changePassword begin : ${args.id}`, { requestId: `${requestId}` });
    // tìm password trong database
    const user = await dataStore.findOne({
      type: 'UserModel',
      filter: { _id: userId },
      projection: {
        password: 1
      }
    })
    const userPassword = lodash.get(user, 'password');
    // lấy băm mật khẩu trong database
    const currentPassword = await bcrypt.compare(args.currentPassword, userPassword);
    if (!currentPassword) {
      return Promise.reject(returnCodes(errorCodes, 'InvalidCurrentPassword'));
    }
    // tạo mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(args.newPassword, salt);
    const verifiedNewPassword = await bcrypt.hash(args.verifiedNewPassword, salt);
    if (verifiedNewPassword !== newPassword) {
      return Promise.reject(returnCodes(errorCodes, 'InvalidVerifiedNewPassword'));
    }
    const updateUser = await dataStore.updateOne({
      type: 'UserModel',
      id: userId,
      data: {
        password: newPassword,
        verifiedNewPassword: verifiedNewPassword
      }
    })
    return Promise.resolve(updateUser)
      .then(result => {
        if (result.ok === 1) {
          loggingFactory.debug(`function changePassword end`, { requestId: `${requestId}` });
          return { message: 'Đổi mật khẩu thành công !' }
        }
      })
      .catch(err => {
        loggingFactory.error(`function changePassword has error : ${err}`, { requestId: `${requestId}` });
        return Promise.reject(err)
      })
  };
  // update user
  this.updateUser = function (args, opts) {
    const { loggingFactory, requestId } = opts;
    const userId = args.id;
    args = addFieldForAuditing(args);
    loggingFactory.debug(`function updateUser : ${args.id}`, { requestId: `${requestId}` })

    return checkDuplicateEmail(args.email, userId)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateEmailRegister'));
        }
        return dataStore.update({
          type: 'UserModel',
          id: userId,
          data: args
        })
          .then(user => convertUserResponse(user))
          .catch(err => {
            loggingFactory.error(`function updateUser has error : ${err} `, { requestId: `${requestId}` });
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

function checkDuplicateEmail(email, id) {
  return dataStore.count({
    type: 'UserModel',
    filter: {
      _id: { $ne: id },
      email: email
    }
  })
    .then(result => result >= 1 ? true : false)
}

function convertGetUsers(users) {
  return Promise.map(
    users,
    user => {
      return convertUserResponse(user);
    },
    { concurrency: 5 }
  );
};

function convertUserResponse(user) {
  if (!isEmpty(user)) {
    user = user.toJSON();
    user.id = user._id;
    user.name = `${get(user, 'firstName')} ${get(user, 'lastName')}`;
    const permissions = get(user, 'permissions');
    user.permissions = convertPermissionsResponse(permissions);
    const gender = get(user, 'gender');
    user.gender = convertGenderResponse(gender);
    delete user._id;
    return user;
  } else {
    return Promise.resolve();
  }
};

function convertPermissions(permissions) {
  if (!isEmpty(permissions)) {
    return permissions.map(e => {
      switch (e) {
        case constants.ROLE.ADMIN:
          return 'ADMIN';
        case constants.ROLE.OPERATOR:
          return 'OPERATOR';
        case constants.ROLE.USER:
          return 'USER';
        default: return null
      }
    })
  }
};

function convertPermissionsResponse(permissions) {
  if (!isEmpty(permissions)) {
    return permissions.map(e => {
      switch (e) {
        case 'ADMIN':
          return constants.ROLE.ADMIN;
        case 'OPERATOR':
          return constants.ROLE.OPERATOR;
        case 'USER':
          return constants.ROLE.USER;
        default: return null
      }
    })
  }
};

function convertGender(gender) {
  switch (gender) {
    case constants.GENDER.MALE:
      return 'Nam';
    case constants.GENDER.FEMALE:
      return 'Nữ';
    case constants.GENDER.UNKNOWN:
      return 'Không xác định';
    default: return null
  }
};

function convertGenderResponse(gender) {
  switch (gender) {
    case 'Nam':
      return constants.GENDER.MALE;
    case 'Nữ':
      return constants.GENDER.FEMALE;
    case 'Không xác định':
      return constants.GENDER.UNKNOWN;
    default: return null
  }
}

function createFindQuery(args) {
  let params = args;
  let q = params.q;
  const query = {
    '$and': [
      { deleted: false }
    ]
  }
  if (!lodash.isEmpty(q)) {
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

exports = module.exports = new UserService();
exports.init = UserService;