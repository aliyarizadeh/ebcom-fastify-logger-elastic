const { writeToFile } = require('./file');
const { parseBody, logLevel } = require('./utils');

let client;

const log = async (message, data) => {
  console.log(message, data);
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
    body: parseBody(res.request?.body, 'REQUEST'),
    timestamp: req.timestamp || Date.now()
  };

  const response = {
    url: req.url,
    statusCode: res.statusCode,
    headers: res.headers,
    body: parseBody(payload, 'RESPONSE'),
    timestamp: Date.now()
  };

  try {
    data = {
      index: 'test-app',
      body: {
        transactionId: res.request.transactionId,
        level: logLevel(res.statusCode),
        hostname: res.request?.hostname,
        request: global.SAVE_TO_FILE ? request : JSON.stringify(request),
        response: global.SAVE_TO_FILE ? response : JSON.stringify(response)
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
    index: 'test-app',
    body: {
      transactionId: req.transactionId,
      stack: error.stack,
      error: error.message || 'Unhandled error',
      code: error.code || undefined
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
