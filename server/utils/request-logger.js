const logger = require("./util.logger");

/**
 * Logger for all http requests
 */

const requestLogger = logger('requests');
requestLogger.stream = {
  write: (request, encoding) => {
    requestLogger.info(request);
  },
};

module.exports = requestLogger;
