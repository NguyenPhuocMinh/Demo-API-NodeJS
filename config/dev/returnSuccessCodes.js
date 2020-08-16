'use strict';

// success message
const successChangePass = 'resources.users.success.successChangePass';
// end success message

const returnSuccessCodes = (successMessage) => {
  const successObject = {};
  successObject.message = successMessage;
  return successObject;
};

module.exports = {
  returnSuccessCodes,
  successChangePass
}
