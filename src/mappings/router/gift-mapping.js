'use strict';

const GiftService = require('../../services/web-admin-gift');

module.exports = [
  // create gift
  {
    pathName: '/gifts',
    method: 'POST',
    methodName: 'createGift',
    serviceName: GiftService
  },
  // get gifts
  {
    pathName: '/gifts',
    method: 'GET',
    methodName: 'getGifts',
    serviceName: GiftService
  },
  // get by id gift
  {
    pathName: '/gifts/:id',
    method: 'GET',
    methodName: 'getByIdGift',
    serviceName: GiftService
  },
  // // update gift
  {
    pathName: '/gifts/:id',
    method: 'PUT',
    methodName: 'updateGift',
    serviceName: GiftService
  },
];
