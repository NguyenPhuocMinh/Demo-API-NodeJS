'use strict';

const winrow = require('winrow');
const { slugifyString } = winrow;
const ProductTypeService = require('../../services/web-admin-product-type');

module.exports = [
  // create productType
  {
    pathName: '/productTypes',
    method: 'POST',
    methodName: 'createProductType',
    serviceName: ProductTypeService,
    input: {
      transform: function (req) {
        const name = req.body.name;
        return {
          name: name,
          activated: req.body.activated,
          slug: slugifyString(name),
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
  // get productType
  {
    pathName: '/productTypes',
    method: 'GET',
    methodName: 'getProductTypes',
    serviceName: ProductTypeService,
    input: {
      transform: function (req) {
        const name = req.body.name;
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
  // get by id productType
  {
    pathName: '/productTypes/:id',
    method: 'GET',
    methodName: 'getByIdProductType',
    serviceName: ProductTypeService,
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
  // // update productType
  {
    pathName: '/productTypes/:id',
    method: 'PUT',
    methodName: 'updateProductType',
    serviceName: ProductTypeService,
    input: {
      transform: function (req) {
        const name = req.body.name;
        return {
          id: req.params.id,
          name: name,
          activated: req.body.activated,
          slug: slugifyString(name),
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
];
