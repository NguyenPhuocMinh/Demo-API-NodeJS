'use strict';

const winrow = require('winrow');
const { slugifyString } = winrow;
const ProductService = require('../../services/web-admin-product');

module.exports = [
  // create product
  {
    pathName: '/products',
    method: 'POST',
    methodName: 'createProduct',
    serviceName: ProductService,
    input: {
      transform: function (req) {
        const name = req.body.name;
        return {
          name: name,
          weight: req.body.weight,
          smells: req.body.smells,
          gifts: req.body.gifts,
          price: req.body.price,
          productType: req.body.productType,
          quantity: req.body.quantity,
          skin: req.body.skin,
          status: req.body.status,
          slug: slugifyString(name),
          activated: req.body.activated
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
  // get products
  {
    pathName: '/products',
    method: 'GET',
    methodName: 'getProducts',
    serviceName: ProductService,
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
  // get by id product
  {
    pathName: '/products/:id',
    method: 'GET',
    methodName: 'getByIdProduct',
    serviceName: ProductService,
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
  // // update product
  {
    pathName: '/products/:id',
    method: 'PUT',
    methodName: 'updateProduct',
    serviceName: ProductService,
    input: {
      transform: function (req) {
        const name = req.body.name;
        return {
          id: req.params.id,
          name: name,
          weight: req.body.weight,
          smells: req.body.smells,
          gifts: req.body.gifts,
          price: req.body.price,
          productType: req.body.productType,
          quantity: req.body.quantity,
          skin: req.body.skin,
          status: req.body.status,
          slug: slugifyString(name),
          activated: req.body.activated
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
