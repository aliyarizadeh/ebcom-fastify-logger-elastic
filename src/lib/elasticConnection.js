const { Client, Serializer } = require('@elastic/elasticsearch');

const { serializer } = require('./utils');

class MySerializer extends Serializer {
  serialize (object) {
    return serializer(object);
  }
}

const defaultOptions = {
  Serializer: MySerializer,
  node: 'http://localhost:9200',
  headers: {
    service_name: 'fastify-service'
  }
};

let client;

module.exports = async (options) => {
  try {
    client = new Client(Object.keys(options).length ? options : defaultOptions);
    const info = await client.info();
    console.log('Connect to elastic, cluster name: ', info.cluster_name);
  } catch (e) {
    console.error('Error in elastic connection: ', e);
    global.SAVE_TO_FILE = true;
  }
  return client;
};

setInterval(async () => {
  try {
    const healthCheck = await client?.cat?.health();
    if (healthCheck.indexOf('red') >= 0) global.SAVE_TO_FILE = true;
    if (global.SAVE_TO_FILE && !healthCheck.indexOf('red') > 0) global.SAVE_TO_FILE = false;
  } catch (e) {
    global.SAVE_TO_FILE = false; // TODO Change to true
  }
}, global.INTERVAL_TIME * 60 * 1000); // 5 Minute
