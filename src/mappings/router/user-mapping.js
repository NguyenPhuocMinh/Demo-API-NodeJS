'use strict';

const UserService = require('../../services/web-admin-user');

module.exports = [
  // user register
  {
    pathName: '/users',
    method: 'POST',
    methodName: 'registerUser',
    serviceName: UserService
  },
  // get users
  {
    pathName: '/users',
    method: 'GET',
    methodName: 'getUsers',
    serviceName: UserService
  },
  // get users by id
  {
    pathName: '/users/:id',
    method: 'GET',
    methodName: 'getUserById',
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
  // update user
  {
    pathName: '/user/:id',
    method: 'PUT',
    methodName: 'updateUser',
    serviceName: UserService
  },
]