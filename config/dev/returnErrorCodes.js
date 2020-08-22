'use strict';

// error message
const duplicateEmailRegister = 'Email đã tồn tại';
const notFoundEmail = 'Email không tìm thấy';
const inValidPassword = 'Mật khẩu không đúng';
const verifiedPasswordRegister = 'Xác nhận mật khẩu không trùng khớp';
const duplicateSlugAccount = 'Tên account đã tồn tại';
const duplicateSlugRank = 'Rank đã tồn tại';
const invalidCurrentPassword = 'resources.users.errors.invalidCurrentPassword';
const invalidVerifiedNewPassword = 'resources.users.errors.invalidVerifiedNewPassword';
// end error message

const returnErrorCodes = (errorMessage) => {
  const errorObject = {};
  errorObject.message = errorMessage;
  return errorObject;
}

module.exports = {
  returnErrorCodes,
  duplicateEmailRegister,
  verifiedPasswordRegister,
  duplicateSlugAccount,
  duplicateSlugRank,
  notFoundEmail,
  inValidPassword,
  invalidCurrentPassword,
  invalidVerifiedNewPassword
} 