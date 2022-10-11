/* eslint-disable n/no-path-concat */
const fs = require('fs').promises;

const writeToFile = async (data) => {
  try {
    await fs.stat(`${global.FILE_PATH}${global.FILE_NAME}`);
    await fs.appendFile(`${global.FILE_PATH}${global.FILE_NAME}`, `${JSON.stringify(data)}\n`);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      await fs.writeFile(`${global.FILE_PATH}${global.FILE_NAME}`, `${JSON.stringify(data)}\n`);
    } else throw error;
  }
};

module.exports = {
  writeToFile
};
