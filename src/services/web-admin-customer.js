'use strict';

const Promise = require('web-server').Promise;
const lodash = require('web-server').lodash;

function CustomerService() {

  // register customer
  this.registerCustomer = function (req, res) {

  };
  // login customer
  this.loginCustomer = function (req, res) {

  };
};

exports = module.exports = new CustomerService();
exports.init = CustomerService;