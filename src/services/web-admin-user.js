'use strict';

const webServer = require('web-server-node');
require('web-server-node').momentTimezone;
const {
  Promise,
  lodash,
  moment,
  loggingFactory,
  returnCodes
} = webServer;
const User = require("modeller").UserModel;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const constants = require('../utils/constant');
const data = require('../../config/data/secret');
const verify = require('../utils/verifyToken');
const errorCodes = require('../../config/dev/errorCodes');
const webConfig = require('../../config/dev/webConfig');
const { isEmpty, get, isArray } = lodash;
let tokenList = {};

function UserService() {
  const timezone = constants.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // register user
  this.registerUser = async function (args) {
    loggingFactory.info(JSON.stringify(args));
    // Hash Password
    let password = '';
    if (isEmpty(args.password)) {
      password = '123';
    } else {
      password = args.password
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const permissions = convertPermissions(args.permissions);
    const gender = convertGender(args.gender);

    const user = new User({
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      password: hashPassword,
      permissions: permissions,
      gender: gender,
      createdAt: nowMoment,
      createdBy: 'SYSTEMS',
      updatedAt: nowMoment,
      updatedBy: 'SYSTEMS'
    })

    return checkDuplicateEmail(args.email)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateEmailRegister'));
        }
        return Promise.resolve(user)
          .then(user => convertUserResponse(user))
          .then(result => {
            return result;
          })
          .then(() => user.save())
          .catch(err => {
            loggingFactory.error('Error Register:', JSON.stringify(err, null, 2));
            return Promise.reject(err);
          });
      })
  };
  // login user
  this.loginUser = async function (args) {
    try {
      const userLogin = await User.findOne({ email: args.email })
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
      loggingFactory.silly('User Login Info:',
        [
          { 'userId': userLogin.id },
          { 'refreshToken': refreshToken },
          { 'expiresIn': data.tokenLife },
          { 'name': userLogin.firstName + " " + userLogin.lastName },
          { 'permissions': userLogin.permissions },
        ]
      )
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
      console.log("err", err)
      loggingFactory.error('Error Login:', JSON.stringify(err, null, 1))
      return Promise.reject(err);
    }
  };
  // get user
  this.getUsers = function (args) {
    const params = args.params;
    const skip = parseInt(params._start) || constants.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constants.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(params);
    const sort = createSortQuery(params);

    const response = {};
    return User.find(query, {
      createdAt: 0,
      createdBy: 0,
      updatedAt: 0,
      updatedBy: 0
    },
      {
        sort: sort, skip: skip, limit: limit
      })
      .then(users => convertGetUsers(users))
      .then(dataResponse => {
        response.data = dataResponse;
      })
      .then(() => {
        return User.countDocuments(query)
      })
      .then(total => {
        response.total = total;
        return response;
      })
      .catch(err => {
        loggingFactory.error('Get user Error', err);
        return Promise.reject(err);
      })
  };
  // get user by id
  this.getUserById = function (args) {
    console.log("this.getUserById -> args", args)
    const userId = args.id;
    return User.findById({ _id: userId })
      .then(user => convertUserResponse(user))
      .catch(err => {
        loggingFactory.error("Get By Id Error", err);
        return Promise.reject(err);
      })
  };
  // refresh token
  this.refreshTokenHandler = async function (args) {
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
  // check token
  this.tokenCheckMiddleware = async function (req, res, next) {
    // Lấy thông tin mã token được đính kèm trong request
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
      // Xác thực mã token và kiểm tra thời gian hết hạn của mã
      try {
        const decoded = await verify.verifyJwtToken(token, data.secret);
        // Lưu thông tin giã mã được vào đối tượng req, dùng cho các xử lý ở sau
        req.decoded = decoded;
        next();
      } catch (err) {
        loggingFactory.error("Hết hạn token:", err);
        console.error(err);
        return res.status(401).json({
          message: 'Token bị hết hạn',
        });
      }
    } else {
      // Không tìm thấy token trong request
      return res.status(403).send({
        message: 'Không tìm thấy token',
      });
    }
  };
  // change password
  this.changePassword = async function (args) {
    let userId = args.id;
    // tìm password trong database
    const user = await User.findOne({ _id: userId }, {
      password: 1
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
    const updateUser = User.updateOne({ _id: userId }, {
      password: newPassword,
      verifiedPassword: verifiedNewPassword
    }, { new: true })
    return Promise.resolve(updateUser)
      .then(result => {
        if (result.ok === 1) {
          return { message: 'Đổi mật khẩu thành công !' }
        }
      })
      .catch(err => {
        loggingFactory.error('Change Pass Error: ', err);
        return Promise.reject(err)
      })
  };
  // update user
  this.updateUser = function (args) {
    const userId = args.id;
    return checkDuplicateEmail(args.email, userId)
      .then(duplicate => {
        if (duplicate) {
          return Promise.reject(returnCodes(errorCodes, 'DuplicateEmailRegister'));
        }
        return User.findByIdAndUpdate(
          { _id: userId },
          {
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email,
            gender: args.gender,
            avatar: args.avatar,
            permissions: args.permissions,
            updatedAt: nowMoment,
            updatedBy: 'SYSTEMS'
          },
          { new: true }
        )
          .then(user => convertUserResponse(user))
          .catch(err => {
            loggingFactory.error("Update User Error ", err);
            return Promise.reject(err);
          })
      })
  };
};

function checkDuplicateEmail(email, id) {
  return User.countDocuments({
    _id: { $ne: id },
    email: email
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

module.exports = new UserService();