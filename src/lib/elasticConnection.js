const { Client, Serializer } = require('@elastic/elasticsearch');

const { filterData } = require('./utils');

class MySerializer extends Serializer {
  serialize (object) {
    return filterData(object);
  }
}

const defaultOptions = {
  // Serializer: MySerializer,
  node: 'http://localhost:9200',
  // requestTimeout: 10000,
  // compression: false,
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
  console.log(global.SAVE_TO_FILE); // TODO remove this line

  try {
    const healthCheck = await client?.cat?.health();
    if (healthCheck.indexOf('red') > 0) global.SAVE_TO_FILE = true;
  } catch (e) {
    global.SAVE_TO_FILE = true;
  }
}, 5 * 1000); // 5 Minute
