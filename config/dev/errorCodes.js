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
    nameCode: 'InvalidCurrentPassword',
    messageCode: 'Mật khẩu hiển tại không đúng',
    returnCode: 2,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateEmailRegister',
    messageCode: 'Email đã được đăng ký',
    returnCode: 3,
    statusCode: 400,
  },
  {
    nameCode: 'EmailNotFound',
    messageCode: 'Không tìm thấy email',
    returnCode: 4,
    statusCode: 400,
  },
  {
    nameCode: 'InValidPassword',
    messageCode: 'Mật khẩu không đúng',
    returnCode: 5,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateSlugProduct',
    messageCode: 'Tên sản phẩm đã tồn tại',
    returnCode: 6,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateSlugProductType',
    messageCode: 'Loại sản phẩm đã tồn tại',
    returnCode: 7,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateSlugSmell',
    messageCode: 'Hương vị đã tồn tại',
    returnCode: 8,
    statusCode: 400,
  },
  {
    nameCode: 'DuplicateSlugGift',
    messageCode: 'Tên quà tặng kèm đã tồn tại',
    returnCode: 9,
    statusCode: 400,
  },
  {
    nameCode: 'InvalidVerifiedNewPassword',
    messageCode: 'Mật khẩu mới đã xác minh không hợp lệ',
    returnCode: 10,
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