'use strict';

const AccountMappings = require('./router/account-mapping');
const UserMappings = require('./router/user-mapping');
const UploadMappings = require('./router/upload-mapping');

const mappings = [
  ...AccountMappings,
  ...UserMappings,
  ...UploadMappings
];

module.exports = mappings;