'use strict';

const UploadService = require('../../services/web-admin-upload');

module.exports = [
  // upload image
  {
    pathName: '/uploadImages/:id',
    method: 'UPLOAD',
    methodName: 'uploadImages',
    serviceName: UploadService
  },
]