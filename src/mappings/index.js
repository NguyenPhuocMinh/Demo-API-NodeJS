'use strict';

const UserMappings = require('./router/user-mapping');
const ProductMappings = require('./router/product-mapping');
const ProductTypeMappings = require('./router/product-type-mapping');
const SmellMappings = require('./router/smell-mapping');
const GiftMappings = require('./router/gift-mapping');

const mappings = [
  ...UserMappings,
  ...ProductMappings,
  ...ProductTypeMappings,
  ...SmellMappings,
  ...GiftMappings
];

module.exports = mappings;