const { writeToFile } = require('./file');
const { parseBody, logLevel } = require('./utils');

let client;

const log = async (message = 'Custom log', data) => {
  if (message && typeof message !== 'string') throw new Error('Message should be string');

  if (data && typeof data === 'object') {
    data = {
      index: global.ELASTIC_INDEX,
      body: {
        message,
        statusCode: data.statusCode,
        request: data.request[Object.getOwnPropertySymbols(data.request).find((s) => String(s) === 'Symbol(body)')] || undefined,
        response: data.body,
        timestamp: new Date()
      }
    };
  }

  try {
    if (!global.SAVE_TO_FILE) {
      await client.index(data);
    } else {
      await writeToFile(data);
    }
  } catch (e) {
    await writeToFile(data);
  }

  return true;
};

// // Capture normal request response logs
const captureLog = async (req, res, payload) => {
  let data;

  const request = {
    url: req.url,
    method: res.request?.method,
    headers: res.request?.headers,
    params: res.request?.params,
    query: res.request?.query,
    payload: parseBody(res.request?.body, 'REQUEST'),
    timestamp: req.timestamp || new Date()
  };

  const response = {
    url: req.url,
    statusCode: res.statusCode,
    headers: res.headers,
    payload: parseBody(payload, 'RESPONSE'),
    timestamp: new Date()
  };

  try {
    data = {
      index: global.ELASTIC_INDEX,
      body: {
        transactionId: res.request.transactionId,
        level: logLevel(res.statusCode),
        hostname: res.request?.hostname,
        request: global.SAVE_TO_FILE ? request : JSON.stringify(request),
        response: global.SAVE_TO_FILE ? response : JSON.stringify(response),
        timestamp: new Date()
      }
    };

    if (!global.SAVE_TO_FILE) {
      await client.index(data);
    } else {
      await writeToFile(data);
    }
  } catch (e) {
    await writeToFile(data);
  }

  return true;
};

const captureErrorLog = async (req, res, error) => {
  const data = {
    index: global.ELASTIC_INDEX,
    body: {
      transactionId: req.transactionId,
      stack: error.stack,
      error: error.message || 'Unhandled error',
      code: error.code || undefined,
      timestamp: req.timestamp || new Date()
    }
  };

  try {
    if (!global.SAVE_TO_FILE) {
      await client.index(data);
    } else {
      await writeToFile(data);
    }
  } catch (e) {
    await writeToFile(data);
  }
};

const getClient = (elasticClient) => {
  if (elasticClient) client = elasticClient;
  else global.SAVE_TO_FILE = true;

  return client;
};

module.exports = {
  getClient,
  log,
  captureLog,
  captureErrorLog
};
