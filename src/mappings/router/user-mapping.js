'use strict';

const winrow = require('winrow');
const lodash = winrow.require('lodash');
const { get } = lodash;
const UserService = require('../../services/web-admin-user');
const { userLoginSchema } = require('../../utils/schema');

module.exports = [
  // user register
  {
    pathName: '/users',
    method: 'POST',
    methodName: 'registerUser',
    serviceName: UserService,
    input: {
      transform: function (req) {
        return {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          gender: req.body.gender,
          permissions: req.body.permissions
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          body: response
        }
      }
    }
  },
  // user login
  {
    pathName: '/user/logins',
    method: 'POST',
    methodName: 'loginUser',
    serviceName: UserService,
    input: {
      transform: function (req, opts) {
        const { validator } = opts;
        const { valid, errors } = validator(userLoginSchema, req.body);
        if (!valid) {
          return Promise.reject(errors);
        }
        return {
          email: req.body.email,
          password: req.body.password
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          headers: {
            'X-AccessToken': get(response, 'token')
          },
          body: response
        }
      }
    }
  },
  // get users
  {
    pathName: '/users',
    method: 'GET',
    methodName: 'getUsers',
    serviceName: UserService,
    input: {
      transform: function (req) {
        return {
          params: req.query
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          headers: {
            'X-Total-Count': response.total,
            'Access-Control-Expose-Headers': 'X-Total-Count'
          },
          body: response.data
        }
      }
    }
  },
  // get users by id
  {
    pathName: '/users/:id',
    method: 'GET',
    methodName: 'getUserById',
    serviceName: UserService,
    input: {
      transform: function (req) {
        return {
          id: req.params.id
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          body: response
        }
      }
    }
  },
  // refreshTokens
  {
    pathName: '/user/refreshTokens',
    method: 'POST',
    methodName: 'refreshTokenHandler',
    serviceName: UserService,
    input: {
      transform: function (req) {
        return {
          refreshToken: req.body.refreshToken
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          headers: {
            'X-AccessToken': get(response, 'token')
          },
          body: response
        }
      }
    }
  },
  // change pass word
  {
    pathName: '/user/changePasswords/:id',
    method: 'PUT',
    methodName: 'changePassword',
    serviceName: UserService,
    input: {
      transform: function (req) {
        return {
          id: req.params.id,
          currentPassword: req.body.currentPassword,
          newPassword: req.body.newPassword,
          verifiedNewPassword: req.body.verifiedNewPassword
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          body: response
        }
      }
    }
  },
  // update user
  {
    pathName: '/user/:id',
    method: 'PUT',
    methodName: 'updateUser',
    serviceName: UserService,
    input: {
      transform: function (req) {
        return {
          id: req.params.id,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          gender: req.body.gender,
          avatar: req.body.avatar,
          permissions: req.body.permissions,
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          body: response
        }
      }
    }
  },
]