'use strict';

const lodash = require('web-server-node').lodash;
const { get } = lodash;
const UserService = require('../../services/web-admin-user');

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
          ...req.body
        }
      }
    },
    output: {
      transform: function (res, opts) {
        return (
          res.send(opts)
        )
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
      transform: function (res, opts) {
        return (
          res
            .header('X-Total-Count', get(opts, 'total'))
            .header("Access-Control-Expose-Headers", "X-Total-Count")
            .send(get(opts, 'data'))
        )
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
      transform: function (res, opts) {
        res.send(opts)
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
      transform: function (req) {
        return {
          email: req.body.email,
          password: req.body.password
        }
      }
    },
    output: {
      transform: function (res, opts) {
        return (
          res
            .header('X-AccessToken', get(opts, 'token'))
            .send(opts)
        )
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
      transform: function (res, opts) {
        return (
          res
            .header('X-AccessToken', get(opts, 'token'))
            .send(opts)
        )
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
      transform: function (res, opts) {
        return (
          res
            .status(200)
            .send(opts)
        )
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
      transform: function (res, opts) {
        return (
          res.send(opts)
        )
      }
    }
  },
  {
    pathName: 'user/checkToken',
    method: 'POST',
    methodName: 'tokenCheckMiddleware',
    serviceName: UserService
  }
]