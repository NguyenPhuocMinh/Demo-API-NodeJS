'use strict';

const winrow = require('winrow');
const { slugifyString } = winrow;
const SmellService = require('../../services/web-admin-smell');

module.exports = [
  // create smell
  {
    pathName: '/smells',
    method: 'POST',
    methodName: 'createSmell',
    serviceName: SmellService,
    input: {
      transform: function (req) {
        const name = req.body.name;
        return {
          name: name,
          activated: req.body.activated,
          slug: slugifyString(name)
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          body: response
        }
      }
    }
  },
  // get smells
  {
    pathName: '/smells',
    method: 'GET',
    methodName: 'getSmells',
    serviceName: SmellService,
    input: {
      transform: function (req) {
        return {
          params: req.query
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          headers: {
            'X-Total-Count': response.total,
            'Access-Control-Expose-Headers': 'X-Total-Count'
          },
          body: response.data
        }
      }
    }
  },
  // get by id smell
  {
    pathName: '/smells/:id',
    method: 'GET',
    methodName: 'getByIdSmell',
    serviceName: SmellService,
    input: {
      transform: function (req) {
        return {
          id: req.params.id
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          body: response
        }
      }
    }
  },
  // // update smell
  {
    pathName: '/smells/:id',
    method: 'PUT',
    methodName: 'updateSmell',
    serviceName: SmellService,
    input: {
      transform: function (req) {
        const name = req.body.name;
        return {
          id: req.params.id,
          name: name,
          activated: req.body.activated,
          slug: slugifyString(name)
        }
      }
    },
    output: {
      transform: function (response) {
        return {
          body: response
        }
      }
    }
  },
];
