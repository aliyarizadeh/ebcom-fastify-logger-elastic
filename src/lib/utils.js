// const path = require('path');
const uuid = require('uuid');

global.SAVE_TO_FILE = false;
global.FILE_PATH = './';
global.FILE_NAME = 'service.log';
global.ELASTIC_INDEX = 'default';
global.GENERATE_ID = true;
global.INTERVAL_TIME = 10;
global.FILTER_FIELD = ['cvv2', 'pass', 'password', 'token', 'TOKEN', 'refresh_token', 'refreshToken', 'pin', 'pin1', 'authorization'];
global.FILTER_TAGS = '';

const idGenerator = () => (`${uuid.v4().replaceAll('-', '')}${uuid.v4().replaceAll('-', '')}`);

function optionValidate (options) {
  if (options && typeof options !== 'object') throw new Error('Options should be an object');
  const validOptions = ['index', 'node', 'nodes', 'auth', 'maxRetries', 'requestTimeout', 'pingTimeout', 'sniffInterval', 'sniffOnStart', 'sniffEndpoint', 'sniffOnConnectionFault', 'resurrectStrategy',
    'suggestCompression', 'compression', 'tls', 'proxy', 'agent', 'nodeFilter', 'nodeSelector', 'generateRequestId', 'name', 'opaqueIdPrefix', 'headers', 'context', 'enableMetaHeader', 'cloud',
    'disablePrototypePoisoningProtection', 'caFingerprint', 'maxResponseSize', 'maxCompressedResponseSize', 'ConnectionPool', 'Connection', 'Serializer', 'path', 'fileName', 'saveFile', 'generateId',
    'timer', 'filter', 'soapTags'];

  if (options) {
    for (const o in options) {
      if (validOptions.indexOf(o) < 0) throw new Error(`Field ${o} is not valid option`);
    }
  }

  if (options.index && typeof options.index === 'string') global.ELASTIC_INDEX = options.index;
  if (typeof options.generateId === 'boolean') global.GENERATE_ID = options.generateId;
  if (options.timer && (typeof options.timer === 'number' || !isNaN(options.timer))) global.INTERVAL_TIME = Number(options.timer);
  if (options.filter && Array.isArray(options.filter)) global.FILTER_FIELD = options.filter;
  if (Array.isArray(options.soapTags)) global.FILTER_TAGS = options.soapTags;
  // if (options.saveFile && typeof options.saveFile === 'boolean') {
  //   global.SAVE_TO_FILE = true;

  // if (options.path && typeof options.path === 'string' && path.isAbsolute(options.path)) {
  // if (options.path[0] === '/') global.FILE_PATH = path.normalize(options.path.slice(1));
  // if (options.startsWith('./')) global.FILE_PATH = path.normalize(options.path.slice(2));
  //     global.FILE_PATH = options.path;
  //   }

  //   if (options.fileName && typeof fileName === 'string') {
  //     if (options.fileName.endsWith('.log')) global.FILE_NAME = options.fileName;
  //     else global.FILE_NAME = `${options.fileName}.log`;
  //   }
  // }

  return options;
};

function serializer (data, writeToFile = false) {
  let { request, response } = data?.body?._doc;
  const filtered = {};

  if (request && typeof request === 'string' && (request.startsWith('{') || request.startsWith('['))) request = JSON.parse(request);
  if (response && typeof request === 'string' && (response.startsWith('{') || response.startsWith('['))) response = JSON.parse(response);

  if ((request && typeof request !== 'object') || (response && typeof response !== 'object')) throw new Error('Invalid request or response type');

  global.FILTER_FIELD.forEach((f) => {
    if (request?.headers && request?.headers[f]) request.headers[f] = '***************';
    if (request?.payload && request?.payload[f]) request.body[f] = '***************';
  });

  global.FILTER_FIELD.forEach((f) => {
    if (response?.payload && response?.payload[f]) response.payload[f] = '***************';
  });

  Object.assign(filtered, { ...data, request, response }); // TODO check here

  // if (writeToFile) return filtered;
  return filtered;
};

function logLevel (statusCode) {
  let level;

  if (statusCode && (statusCode >= 100 && statusCode < 400)) level = 30;
  else if (statusCode && (statusCode >= 400 && statusCode < 500)) level = 40;
  else if (statusCode && (statusCode >= 500 && statusCode < 600)) level = 50;
  else throw new Error('Not support status code');

  return level;
};

function parseBody (body, state) {
  let data;

  if (state === 'REQUEST') {
    data = body;
  } else if (state === 'RESPONSE') {
    if (body.code && body.message) {
      data = body;
    } else {
      try {
        if (body && body.length && typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) data = JSON.parse(body);
        if (Array.isArray(body) && body.length > 3) data = { data: 'bulk-data' };
        if (body && body.length > 1024) data = { data: 'bulk-data' };
      } catch (e) {
        data = { data: 'bulk-data' };
      }
    }
  } else throw new Error('UNKNOWN state');

  return data;
};

module.exports = {
  idGenerator,
  optionValidate,
  serializer,
  logLevel,
  parseBody
};
