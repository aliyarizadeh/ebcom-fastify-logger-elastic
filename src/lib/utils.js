const path = require('path');
const uuid = require('uuid');

global.SAVE_TO_FILE = false;
global.FILE_PATH = '../../../';
global.FILE_NAME = 'service.log';
global.ELASTIC_INDEX = 'default';
global.GENERATE_ID = true;
global.INTERVAL_TIME = 10;

const idGenerator = () => (`${uuid.v4().replaceAll('-', '')}${uuid.v4().replaceAll('-', '')}`);

function optionValidate (options) {
  if (options && typeof options !== 'object') throw new Error('Options should be an object');
  const validOptions = ['index', 'node', 'nodes', 'auth', 'maxRetries', 'requestTimeout', 'pingTimeout', 'sniffInterval', 'sniffOnStart', 'sniffEndpoint', 'sniffOnConnectionFault', 'resurrectStrategy',
    'suggestCompression', 'compression', 'tls', 'proxy', 'agent', 'nodeFilter', 'nodeSelector', 'generateRequestId', 'name', 'opaqueIdPrefix', 'headers', 'context', 'enableMetaHeader', 'cloud',
    'disablePrototypePoisoningProtection', 'caFingerprint', 'maxResponseSize', 'maxCompressedResponseSize', 'ConnectionPool', 'Connection', 'Serializer', 'path', 'fileName', 'saveFile', 'generateId',
    'timer'];

  if (options) {
    for (const o in options) {
      if (validOptions.indexOf(o) < 0) throw new Error(`Field ${o} is not valid option`);
    }
  }

  if (options.index && typeof options.index === 'string') global.ELASTIC_INDEX = options.index;
  if (typeof options.generateId === 'boolean') global.GENERATE_ID = options.generateId;
  if (options.timer && (typeof options.timer === 'number' || !isNaN(options.timer))) global.INTERVAL_TIME = Number(options.timer);

  if (options.saveFile && typeof options.saveFile === 'boolean') {
    global.SAVE_TO_FILE = true;

    if (options.path && typeof options.path === 'string' && path.isAbsolute(options.path)) {
      if (options.path[0] === '/') global.FILE_PATH = path.normalize(options.path.slice(1));
      if (options.startsWith('./')) global.FILE_PATH = path.normalize(options.path.slice(2));
    }

    if (options.fileName && typeof fileName === 'string') {
      global.FILE_NAME = `${options.fileName}.log`;
    }
  }

  return options;
};
const filter__ = ['cvv2', 'pass', 'password', 'token', 'TOKEN', 'refresh_token', 'refreshToken', 'pin', 'pin1', 'authorization'];

function filterData (data) {
  let { request, response } = data;
  const filtered = {};

  if (request && request.length && (request.startsWith('{') || request.startsWith('['))) request = JSON.parse(request);
  if (response && response.length && (response.startsWith('{') || response.startsWith('['))) response = JSON.parse(response);

  filter__.forEach((f) => {
    if (request?.headers[f]) request.headers[f] = '***************';
    if (request?.body[f]) request.body[f] = '***************';
  });

  filter__.forEach((f) => {
    if (response?.payload[f]) response.payload[f] = '***************';
  });

  Object.assign(filtered, { ...data, request: JSON.stringify(request), response: JSON.stringify(response) });

  return JSON.stringify(filtered);
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
    if (body && body.length && (body.startsWith('{') || body.startsWith('['))) data = JSON.parse(body);
    if (Array.isArray(data) && data.length > 3) data = 'bulk-data';
    if (body && body.length > 1024) data = 'bulk-data';
  } else throw new Error('UNKNOWN state');

  return data;
};

module.exports = {
  idGenerator,
  optionValidate,
  filterData,
  logLevel,
  parseBody
};
