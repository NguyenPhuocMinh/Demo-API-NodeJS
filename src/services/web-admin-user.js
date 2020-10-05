'use strict';
const webServer = require('web-server');
require('web-server').momentTimezone;
const {
  Promise,
  lodash,
  moment,
  loggingFactory
} = webServer;
const User = require("modeller").UserModel;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const constants = require('../utils/constant');
const data = require('../../config/data/secret');
const verify = require('../utils/verifyToken');
// const nodemailer = require('nodemailer');
const returnCodes = require('../../config/dev/errorCodes');
const { isEmpty } = lodash;
let tokenList = {};

function UserService() {
  const timezone = constants.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // register user
  this.registerUser = async function (req, res) {
    loggingFactory.info(JSON.stringify(req.body));
    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const verifiedPassword = await bcrypt.hash(req.body.verifiedPassword, salt);
    if (verifiedPassword !== hashPassword) {
      return res
        .status(400)
        .send(returnCodes('InvalidVerifiedPassword'));
    }
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashPassword,
      verifiedPassword: verifiedPassword,
      permissions: req.body.permissions,
      createdAt: nowMoment,
      createdBy: 'SYSTEMS',
      updatedAt: nowMoment,
      updatedBy: 'SYSTEMS'
    })
    return checkDuplicateEmail(req.body.email)
      .then(duplicate => {
        if (duplicate) {
          return res.status(400).send(returnCodes('DuplicateEmailRegister'));
        }
        return Promise.resolve(user)
          .then(user => convertUserResponse(user))
          .then(result => res.send(result))
          .then(() => user.save())
          .catch(err => {
            loggingFactory.error('Error Register:', JSON.stringify(err, null, 2));
            return Promise.reject(err);
          });
      })
  };
  // login user
  this.loginUser = async function (req, res) {
    try {
      const userLogin = await User.findOne({ email: req.body.email })
      if (!userLogin) {
        return res.status(400).send(returnCodes('EmailNotFound'));
      }
      const validPass = await bcrypt.compare(req.body.password, userLogin.password);
      if (!validPass) {
        return res.status(400).send(returnCodes('InValidPassword'));
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
      res
        .header('X-Access-Token', token)
        .send({
          token: token,
          refreshToken: refreshToken,
          expiresIn: data.tokenLife,
          id: userLogin.id,
          name: userLogin.firstName + " " + userLogin.lastName,
          permissions: userLogin.permissions,
        });
    } catch (err) {
      loggingFactory.error('Error Login:', JSON.stringify(err, null, 1))
      return Promise.reject(err);
    }
  };
  // refresh token
  this.refreshTokenHandler = async function (req, res) {
    const { refreshToken } = req.body;
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
      res
        .header('X-Access-Token', token)
        .send({
          token: token,
          id: userLogin.id,
          refreshToken: refreshTokenHandle,
          expiresIn: data.tokenLife,
          permissions: userLogin.permissions,
          // webConfigs: webConfigs
        })
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
  this.changePassword = async function (req, res) {
    let userId = req.params.id;
    // tìm password trong database
    const user = await User.findOne({ _id: userId }, {
      password: 1
    })
    const userPassword = lodash.get(user, 'password');
    // lấy băm mật khẩu trong database
    const currentPassword = await bcrypt.compare(req.body.currentPassword, userPassword);
    if (!currentPassword) {
      return res
        .status(400)
      // .send(returnErrorCodes(invalidCurrentPassword));
    }
    // tạo mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(req.body.newPassword, salt);
    const verifiedNewPassword = await bcrypt.hash(req.body.verifiedNewPassword, salt);
    if (verifiedNewPassword !== newPassword) {
      return res.status(400).send(returnErrorCodes(invalidVerifiedNewPassword));
    }
    const updateUser = User.updateOne({ _id: userId }, {
      password: newPassword,
      verifiedPassword: verifiedNewPassword
    }, { new: true })
    updateUser
      .then(result => {
        if (result.ok === 1) {
          res
            .status(200)
          // .send(returnSuccessCodes(successChangePass))
        }
      })
      .catch(err => {
        loggingFactory.error('Change Pass Error: ', err);
        return Promise.reject(err)
      })
  };
  // update user
  this.updateUser = function (req, res) {
    const userId = req.params.id;
    return checkDuplicateEmail(req.body.email, userId)
      .then(duplicate => {
        if (duplicate) {
          return res.status(400).send(returnCodes('DuplicateEmailRegister'));
        }
        return User.findByIdAndUpdate(
          { _id: userId },
          {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            gender: req.body.gender,
            avatar: req.body.avatar,
            permissions: req.body.permissions,
            updatedAt: nowMoment,
            updatedBy: 'SYSTEMS'
          },
          { new: true }
        )
          .then(user => convertUserResponse(user))
          .then(result => res.send(result))
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

function convertUserResponse(user) {
  if (!isEmpty(user)) {
    user = user.toJSON();
    user.id = user._id;
    let permissions = user.permissions;
    if (!isEmpty(permissions)) {
      user.permissions = permissions;
    } else {
      user.permissions = constants.ROLE.USER;
    }
    delete user._id;
    return user;
  } else {
    return Promise.resolve();
  }
};

function createFindQuery(args) {
  let params = args;
  let q = params.q;
  let query = {};
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
  if (!lodash.isArray(query["$and"])) {
    query["$and"] = [];
  }
  query["$and"].push({ 'adminApp.verified': true });
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