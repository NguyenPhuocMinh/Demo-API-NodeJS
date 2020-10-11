'use strict';

const UserMappings = require('./router/user-mapping');
const ProductMappings = require('./router/product-mapping');
const ProductTypeMappings = require('./router/product-type-mapping');

const mappings = [
  ...UserMappings,
  ...ProductMappings,
  ...ProductTypeMappings
];

module.exports = mappings;