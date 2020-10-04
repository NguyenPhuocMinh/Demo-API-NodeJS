'use strict';

const UserService = require('../../services/web-admin-user');

module.exports = [
  // user register
  {
    pathName: '/user/registers',
    method: 'POST',
    methodName: 'registerUser',
    serviceName: UserService
  },
  // user login
  {
    pathName: '/user/logins',
    method: 'POST',
    methodName: 'loginUser',
    serviceName: UserService
  },
  // refreshTokens
  {
    pathName: '/user/refreshTokens',
    method: 'POST',
    methodName: 'refreshTokenHandler',
    serviceName: UserService
  },
  // change pass word
  {
    pathName: '/user/changePasswords/:id',
    method: 'PUT',
    methodName: 'changePassword',
    serviceName: UserService
  },
]