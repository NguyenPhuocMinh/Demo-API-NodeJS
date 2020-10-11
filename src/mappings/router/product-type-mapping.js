'use strict';

const ProductTypeService = require('../../services/web-admin-product-type');

module.exports = [
  // create productType
  {
    pathName: '/productTypes',
    method: 'POST',
    methodName: 'createProductType',
    serviceName: ProductTypeService
  },
  // get productType
  {
    pathName: '/productTypes',
    method: 'GET',
    methodName: 'getProductTypes',
    serviceName: ProductTypeService
  },
  // get by id productType
  {
    pathName: '/productTypes/:id',
    method: 'GET_ID',
    methodName: 'getByIdProductType',
    serviceName: ProductTypeService
  },
  // // update productType
  {
    pathName: '/productTypes/:id',
    method: 'PUT',
    methodName: 'updateProductType',
    serviceName: ProductTypeService
  },
];
