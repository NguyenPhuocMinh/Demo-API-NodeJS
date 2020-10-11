'use strict';

const lodash = require('web-server').lodash;
const { get, eq } = lodash;

const errorCodes = [
  {
    nameCode: 'InvalidVerifiedPassword',
    messageCode: 'Xác nhận mật khẩu không hợp lệ',
    returnCode: 1,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateEmailRegister',
    messageCode: 'Email đã được đăng ký',
    returnCode: 2,
    statusCode: 400,
  },
  {
    nameCode: 'EmailNotFound',
    messageCode: 'Không tìm thấy email',
    returnCode: 3,
    statusCode: 400,
  },
  {
    nameCode: 'InValidPassword',
    messageCode: 'Mật khẩu không đúng',
    returnCode: 4,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateSlugProduct',
    messageCode: 'Tên sản phẩm đã tồn tại',
    returnCode: 5,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateSlugProductType',
    messageCode: 'Loại sản phẩm đã tồn tại',
    returnCode: 6,
    statusCode: 400,
  },
]

const returnCodes = (name = '') => {
  const error = {};
  errorCodes.map(errorCode => {
    const nameCode = get(errorCode, 'nameCode');
    const messageCode = get(errorCode, 'messageCode');
    const returnCode = get(errorCode, 'returnCode');
    const statusCode = get(errorCode, 'statusCode');
    if (eq(nameCode, name)) {
      error.name = nameCode;
      error.message = messageCode;
      error.returnCode = returnCode;
      error.statusCode = statusCode;
    }
  })
  return error;
}

module.exports = returnCodes;