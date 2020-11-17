'use strict';

const config = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
  },
  colors: {
    error: 'bold red blackBG',
    debug: 'bold blue blackBG',
    warn: 'bold yellow blackBG',
    data: 'bold magenta blackBG',
    info: 'bold green blackBG',
  }
};

module.exports = config;