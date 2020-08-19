'use strict';

const Promise = require('web-server').Promise;
const lodash = require('web-server').lodash;
const User = require("modeller").UserModel;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('web-server').moment;
require('web-server').momentTimezone;
const constants = require('../utils/constant');
const loggingFactory = require('web-server').loggingFactory;
const data = require('../../config/data/secret');
const verify = require('../utils/verifyToken');
// const nodemailer = require('nodemailer');
const webConfigs = require('../../config/dev/webConfigs');
const {
  returnErrorCodes,
  duplicateEmailRegister,
  verifiedPasswordRegister,
  notFoundEmail,
  inValidPassword,
  invalidCurrentPassword,
  invalidVerifiedNewPassword
} = require('../../config/dev/returnErrorCodes');
const {
  returnSuccessCodes,
  successChangePass
} = require('../../config/dev/returnSuccessCodes');
const { isEmpty } = lodash;
let tokenList = {};

function UserService() {
  const timezone = constants.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  this.registerUser = async function (req, res) {
    loggingFactory.info(JSON.stringify(req.body));
    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const verifiedPassword = await bcrypt.hash(req.body.verifiedPassword, salt);
    if (verifiedPassword !== hashPassword) {
      return res
        .status(400)
        .send(returnErrorCodes(verifiedPasswordRegister));
    }
    // Create User
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      gender: !lodash.isNil(req.body.gender) ? req.body.gender : constants.GENDER_DEFAULT,
      avatar: req.body.avatar,
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
          return res.status(400).send(returnErrorCodes(duplicateEmailRegister));
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

  this.loginUser = async function (req, res) {
    try {
      const userLogin = await User.findOne({ email: req.body.email })
      if (!userLogin) {
        return res.status(400).send(returnErrorCodes(notFoundEmail));
      }
      const validPass = await bcrypt.compare(req.body.password, userLogin.password);
      if (!validPass) {
        return res.status(400).send(returnErrorCodes(inValidPassword));
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
          { 'webConfigs': webConfigs }
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
          webConfigs: webConfigs
        });
    } catch (err) {
      loggingFactory.error('Error Login:', JSON.stringify(err, null, 1))
      return Promise.reject(err);
    }
  };

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
          webConfigs: webConfigs
        })
    } catch (err) {
      loggingFactory.error('Refresh Token Error:', err);
      res.status(403).json({
        message: 'Invalid refresh token',
      });
    }
  };

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

  this.showUser = async function (req, res) {
    let response = {};
    let params = req.query;
    let args = req.query;
    const skip = parseInt(params._start) || constants.SKIP_DEFAULT;
    let limit = parseInt(params._end) || constants.LIMIT_DEFAULT;
    limit = limit - skip;
    const query = createFindQuery(args);
    const sort = createSortQuery(params);
    const user = User.find(
      query,
      {
        createdAt: 0,
        createdBy: 0,
        updatedAt: 0,
        updatedBy: 0,
        __v: 0
      },
      { skip, limit, sort }
    )
      .populate('adminApp.roles')
    user
      .then(users => convertBodyUser(users))
      .then(bodyUsers => {
        response.data = bodyUsers;
        return Promise.resolve();
      })
      .then(() => User.countDocuments())
      .then(count => {
        response.total = count;
        return response;
      })
      .then(() =>
        res
          .header("X-Total-Count", response.total)
          .header("Access-Control-Expose-Headers", "X-Total-Count")
          .send(response.data)
      )
      .catch(err => {
        return Promise.reject(err);
      });
  };

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
        .send(returnErrorCodes(invalidCurrentPassword));
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
            .send(returnSuccessCodes(successChangePass))
        }
      })
      .catch(err => {
        loggingFactory.error('Change Pass Error: ', err);
        return Promise.reject(err)
      })
  };

  this.resetPassword = async function (req, res) {
    loggingFactory.info(req.body);
    // Check error
    const { error } = resetPassValidation(req.body);
    const userId = req.params.id;
    // new Password
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(req.body.newPassword, salt);
    const verifiedNewPassword = await bcrypt.hash(req.body.verifiedNewPassword, salt);
    if (verifiedNewPassword !== newPassword) {
      return res.status(400).send({ error: 'Xác nhận mật khẩu không trùng khớp' });
    }
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    // update password
    const updateUser = User.updateOne({ _id: userId }, {
      password: newPassword,
      verifiedPassword: verifiedNewPassword
    }, { new: true })
    updateUser
      .then(result => {
        if (result.ok === 1) {
          res
            .status(200)
            .send({ message: 'Thay đổi mật khẩu thành công!' });
        }
      })
      .catch(err => {
        loggingFactory.error('Change Pass Error: ', err);
        return Promise.reject(err)
      })
  };

  this.sendEmailResetPassword = async function (req, res) {
    const userLogin = await User.findOne({ _id: req.params.id });
    if (!userLogin) {
      return res.status(400).send({ error: 'Email không được tìm thấy' });
    }
    const transporter = await nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'xiuquay55@gmail.com',
        pass: 'Minh0505'
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
    const tokenResetPassword = lodash.get(userLogin, 'adminApp.resetPassword');
    const urlChangePass = `http://localhost:4000/#reset/password/${tokenResetPassword}`;
    const output =
      `<p>Hey ${userLogin.firstName + ' ' + userLogin.lastName || userLogin.email},</p>
    <p>We heard that you lost your Backwoods password. Sorry about that!</p>
    <p>But don’t worry! You can use the following link to reset your password:</p>
    <p> ${urlChangePass} </p>
    <p>If you don’t use this link within 1 hour, it will expire.</p>
    <p>Do something outside today! </p>
    <p>–Your friends at Backwoods</p>`

    const mailOptions = {
      from: userLogin.email,
      to: 'xiuquay55@gmail.com',
      subject: 'Test nodemailer',
      html: output
    }
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        loggingFactory.error('Send Error', err);
        return res.status(400).send({ error: 'Email không được tìm thấy' });
      } else {
        // res.redirect('/forgot');
        return res.send({ message: 'Gửi thành công!, Xin kiểm tra lại mail!' });
      }
    });
  };

  this.profile = async function (req, res) {
    loggingFactory.info(JSON.stringify(req.params.id));
    const userId = req.params.id;
    const userLogin = User.findById({ _id: userId });
    if (!userLogin) {
      return res.status(400).send({ error: 'Không tìm thấy thông tin!' });
    }
    userLogin
      .then(user => convertUserResponse(user))
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error('Profile Has Error: ', err);
        return Promise.reject(err);
      });
  };

  this.updateProfile = function (req, res) {
    loggingFactory.info(JSON.stringify(req.body));
    // userId
    const userId = req.params.id;
    const user = User.findOneAndUpdate(userId, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: !lodash.isNil(req.body.gender) ? req.body.gender : constants.GENDER_DEFAULT,
      avatar: req.body.avatar,
      createdAt: nowMoment,
      createdBy: 'SYSTEMS',
      updatedAt: nowMoment,
      updatedBy: 'SYSTEMS'
    }, { new: true })
    user
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error("Update error", err);
        return Promise.reject(err)
      })
  };
};

function checkDuplicateEmail(email) {
  return User.countDocuments({ email: email })
    .then(result => result >= 1 ? true : false)
}

function convertBodyUser(users) {
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