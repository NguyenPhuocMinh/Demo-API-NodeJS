'use strict';

const ProductService = require('../../services/web-admin-product');

module.exports = [
  // create product
  {
    pathName: '/products',
    method: 'POST',
    methodName: 'createProduct',
    serviceName: ProductService
  },
  // get products
  {
    pathName: '/products',
    method: 'GET',
    methodName: 'getProducts',
    serviceName: ProductService
  },
  // get by id product
  // {
  //   pathName: '/products/:id',
  //   method: 'GET_ID',
  //   methodName: 'getByIdProduct',
  //   serviceName: ProductService
  // },
  // // update product
  // {
  //   pathName: '/products/:id',
  //   method: 'PUT',
  //   methodName: 'updateProduct',
  //   serviceName: ProductService
  // },
];
