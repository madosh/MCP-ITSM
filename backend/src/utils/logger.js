const winston = require('winston');
const config = require('../config/config');

// Define the custom settings for each transport
const options = {
  console: {
    level: config.logging.level,
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  },
};

// Instantiate a new Winston logger with the settings defined above
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// Create a stream object with a 'write' function that will be used by `morgan`
const stream = {
  write: function(message) {
    logger.info(message.trim());
  },
};

module.exports = { logger, stream }; 