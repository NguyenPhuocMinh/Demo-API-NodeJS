'use strict';

const SmellService = require('../../services/web-admin-smell');

module.exports = [
  // create smell
  {
    pathName: '/smells',
    method: 'POST',
    methodName: 'createSmell',
    serviceName: SmellService
  },
  // get smells
  {
    pathName: '/smells',
    method: 'GET',
    methodName: 'getSmells',
    serviceName: SmellService
  },
  // get by id smell
  {
    pathName: '/smells/:id',
    method: 'GET',
    methodName: 'getByIdSmell',
    serviceName: SmellService
  },
  // // update smell
  {
    pathName: '/smells/:id',
    method: 'PUT',
    methodName: 'updateSmell',
    serviceName: SmellService
  },
];
