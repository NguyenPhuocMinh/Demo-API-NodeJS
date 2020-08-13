'use strict';

const AccountService = require('../../services/web-admin-account');

module.exports = [

  // create account
  {
    pathName: '/accounts',
    method: 'POST',
    methodName: 'createAccount',
    serviceName: AccountService
  },
  // get accounts
  {
    pathName: '/accounts',
    method: 'GET',
    methodName: 'getAccounts',
    serviceName: AccountService
  },
  // get by id accounts
  {
    pathName: '/accounts/:id',
    method: 'GET_ID',
    methodName: 'getByIdAccount',
    serviceName: AccountService
  },
  // update account
  {
    pathName: '/accounts/:id',
    method: 'PUT',
    methodName: 'updateAccount',
    serviceName: AccountService
  },
];
