'use strict';

const winston = require('winston');
const options = require('../config/options')

winston.addColors(options.colors);

const Logger = winston.createLogger({
  levels: options.levels,
  format: winston.format.combine(
    winston.format.json(),
    winston.format.colorize({ all: true }),
    winston.format.simple(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.label({ label: '[LOGGER]' }),
    winston.format.printf(info => {
      const { level, message, timestamp, label, labelName } = info;
      return `${labelName ? labelName : label} -- ${level} -- [${timestamp}] -- [${info.requestId}]: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console()
  ],
});

module.exports = Logger;