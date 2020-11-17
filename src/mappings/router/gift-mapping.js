'use strict';

const winrow = require('winrow');
const { slugifyString } = winrow;
const GiftService = require('../../services/web-admin-gift');

module.exports = [
  // create gift
  {
    pathName: '/gifts',
    method: 'POST',
    methodName: 'createGift',
    serviceName: GiftService,
    input: {
      transform: function (req) {
        const name = req.body.name;
        return {
          name: req.body.name,
          activated: req.body.activated,
          slug: slugifyString(name),
        }
      }
    },
    output : {
      transform : function(response) {
        return {
          body : response
        }
      }
    }
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
