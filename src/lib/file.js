const pino = require('pino');
const { serializer } = require('./utils');

const logger = pino({
  timestamp: false,
  formatters: {
    level (label, number) {
      return { _level: number };
    }
  }
}, pino.destination({
  dest: `${global.FILE_PATH}/${global.FILE_NAME}`,
  sync: false // Asynchronous logging
}));

const writeToFile = async (data) => {
  switch (data.body._doc.level) {
    case 30: logger.info(serializer(data.body, true));
      break;
    case 40: logger.warn(serializer(data.body, true));
      break;
    case 50: logger.error(serializer(data.body, true));
      break;
    default: //
  }
};

module.exports = {
  writeToFile
};
