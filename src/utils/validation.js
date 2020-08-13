'use strict';

const Joi = require('@hapi/joi');

const registerValidation = (data) => {
  const schemaRegister = Joi.object().keys({
    firstName: Joi.string().min(2).max(15).required(),
    lastName: Joi.string().min(2).max(15).required(),
    email: Joi.string().email().required(),
    gender: Joi.string().required(),
    avatar: Joi.string(),
    password: Joi.string().regex(/^[\w]{8,30}$/).required(),
    verifiedPassword: Joi.string().regex(/^[\w]{8,30}$/).required(),
    adminApp: Joi.object()
  })
  return schemaRegister.validate(data);
};

const loginValidation = (data) => {
  const schemaLogin = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^[\w]{8,30}$/).required(),
  })
  return schemaLogin.validate(data);
};

const changePassValidation = (data) => {
  const schemaChangePass = Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().regex(/^[\w]{8,30}$/).required(),
    verifiedNewPassword: Joi.string().regex(/^[\w]{8,30}$/).required()
  });
  return schemaChangePass.validate(data);
};

const resetPassValidation = (data) => {
  const schemaResetPass = Joi.object().keys({
    newPassword: Joi.string().regex(/^[\w]{8,30}$/).required(),
    verifiedNewPassword: Joi.string().regex(/^[\w]{8,30}$/).required()
  });
  return schemaResetPass.validate(data);
};

const productValidation = (data) => {
  const schemaProduct = Joi.object().keys({
    name: Joi.string().required(),
    quantity: Joi.number().required(),
    images: Joi.string().required(),
    color: Joi.string().required(),
    price: Joi.number().required(),
    country: Joi.string().required(),
    premiere_date: Joi.string().required(),
    warranty_period: Joi.object(),
    activated: Joi.boolean(),
    status: Joi.boolean().required()
  });
  return schemaProduct.validate(data);
};

const registerUserManageValidation = (data) => {
  const schemaRegisterUserManage = Joi.object().keys({
    firstName: Joi.string().min(2).max(15).required(),
    lastName: Joi.string().min(2).max(15).required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^[\w]{8,30}$/).required(),
    phoneNumber: Joi.string().required()
  });
  return schemaRegisterUserManage.validate(data);
};

const updateUserManageValidation = (data) => {
  const schemaUpdateUserManage = Joi.object().keys({
    firstName: Joi.string().min(2).max(15).required(),
    lastName: Joi.string().min(2).max(15).required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^[\w]{8,30}$/).required(),
    currentPassword: Joi.string().regex(/^[\w]{8,30}$/).required(),
  });
  return schemaUpdateUserManage.validate(data);
};

const InfoVideoValidation = (data) => {
  const schemaInfoVideoManage = Joi.object().keys({
    title: Joi.string().min(2).max(15).required(),
    description: Joi.string().min(2).max(15).required(),
    rangeAgeToWatch: Joi.boolean().required(),
    publish_date: Joi.date(),
    release_date: Joi.date()
  });
  return schemaInfoVideoManage.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  changePassValidation,
  resetPassValidation,
  productValidation,
  registerUserManageValidation,
  updateUserManageValidation,
  InfoVideoValidation
}