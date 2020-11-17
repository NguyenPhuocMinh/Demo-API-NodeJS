### Installation

Install the dependencies and devDependencies and start the server.

```sh
$ npm install winrow-logger
```

### How to use

```js
const logger = require('winrow-logger');

logger.info('message', {requestId : `${requestId}`})
logger.debug('message', {requestId : `${requestId}`})
logger.warn('message', {requestId : `${requestId}`})
logger.error('message', {requestId : `${requestId}`})
```