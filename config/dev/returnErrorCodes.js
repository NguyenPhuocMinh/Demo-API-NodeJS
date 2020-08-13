'use strict';

// error message
const duplicateEmailRegister = 'Email đã tồn tại';
const notFoundEmail = 'Email không tìm thấy';
const inValidPassword = 'Mật khẩu không đúng';
const verifiedPasswordRegister = 'Xác nhận mật khẩu không trùng khớp';
const duplicateSlugAccount = 'Tên account đã tồn tại';
const duplicateSlugRank = 'Rank đã tồn tại';
// end error message

const returnErrorCodes = (errorMessage) => {
  const errorObject = {};
  errorObject.error = errorMessage;
  return errorObject;
}

module.exports = {
  returnErrorCodes,
  duplicateEmailRegister,
  verifiedPasswordRegister,
  duplicateSlugAccount,
  duplicateSlugRank,
  notFoundEmail,
  inValidPassword
} 