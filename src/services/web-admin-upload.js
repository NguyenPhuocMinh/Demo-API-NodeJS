'use strict';

const Promise = require('web-server').Promise;
const lodash = require('web-server').lodash;
const Account = require('modeller').AccountModel;
const moment = require('web-server').moment;
require('web-server').momentTimezone;
const constant = require('../utils/constant');
const loggingFactory = require('web-server').loggingFactory;
const { isEmpty, isArray } = lodash;

function UploadImageService() {
  const timezone = constant.TIMEZONE_DEFAULT;
  const nowMoment = moment.tz(timezone).utc();

  // upload images
  this.uploadImages = async function (req, res) {
    const accountId = req.params.id;
    const files = req.files;
    const images = convertImages(files);
    loggingFactory.info("upload image start");
    return Account.findByIdAndUpdate(
      { _id: accountId },
      {
        images: images,
        updatedAt: nowMoment,
        updatedBy: 'SYSTEMS'
      },
      { new: true }
    )
      .then(account => convertAccountResponse(account))
      .then(result => res.send(result))
      .catch(err => {
        loggingFactory.error("Upload Images Error ", err);
        return Promise.reject(err);
      })
  };
};

function convertAccountResponse(account) {
  if (!isEmpty(account)) {
    account = account.toJSON();
    account.id = account._id;
    delete account._id;
    return account;
  } else {
    return Promise.resolve();
  }
};

function convertImages(files) {
  const images = [];
  if (!isEmpty(files) && isArray(files)) {
    files.map(file => {
      let dataImage = {};
      dataImage.filename = file.filename;
      dataImage.path = file.path;
      images.push(dataImage);
    })
  }
  return images;
};

module.exports = new UploadImageService();