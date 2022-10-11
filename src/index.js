const fp = require('fastify-plugin');

const elasticConnection = require('./lib/elasticConnection');
const logger = require('./lib/logger');
const { idGenerator, optionValidate } = require('./lib/utils');

// const log = async (message, log) => {
//   console.log(message, log);
// };

module.exports = fp(async (fastify, options, next) => {
  logger.getClient(await elasticConnection(optionValidate(options)));

  const { captureLog, captureErrorLog, log } = logger;

  fastify.addHook('onRequest', (request, reply, done) => {
    request.timestamp = new Date();
    request.transactionId = idGenerator();
    request.log = log;
    done();
  });

  fastify.addHook('onSend', (request, reply, payload, done) => {
    captureLog(request, reply, payload);
    done();
  });

  fastify.addHook('onError', (request, reply, error, done) => {
    captureErrorLog(request, reply, error);
    done();
  });

  fastify.addHook('onTimeout', (request, reply, done) => {
    captureLog(request, reply, JSON.stringify({ payload: 'Response timeout' }));
    done();
  });

  next();
});
