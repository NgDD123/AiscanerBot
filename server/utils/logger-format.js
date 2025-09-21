const loggerFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms - :total-time[digits] ms';

module.exports = loggerFormat;