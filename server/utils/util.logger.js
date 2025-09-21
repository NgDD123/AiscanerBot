const fs = require("fs");
const path = require("path");
const winston = require("winston");
require("winston-daily-rotate-file");

const logger = (logsPath = '') => {
    // Sanitize the input path to remove any leading slashes or backslashes
    const cleanLogPath = logsPath.replace(/^[/\\]+/, "");

    // Construct the full log directory path
    const logDir = path.join(__dirname, "../", "logs", cleanLogPath);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Define paths for exception and rejection logs
    const exceptionsLogPath = path.join(logDir, "exceptions.log");
    const rejectionsLogPath = path.join(logDir, "rejections.log");

    // Define the log format
    const winstonFormat = winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        }),
        winston.format.json()
    );

    // Set up log transports
    const transports = [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
            dirname: logDir,
            filename: 'application',
            extension: '.log',
            datePattern: 'YYYY-w',
        }),
    ];

    // Create the logger
    const createdLogger = winston.createLogger({
        format: winstonFormat,
        transports
    });

    // Handle exceptions and rejections only in production
    if (process.env.NODE_ENV?.toLowerCase() === 'production') {
        createdLogger.exceptions.handle(
            new winston.transports.File({ filename: exceptionsLogPath }),
        );
        createdLogger.rejections.handle(
            new winston.transports.File({ filename: rejectionsLogPath }),
        );
    }

    return createdLogger;
};

module.exports = logger;
