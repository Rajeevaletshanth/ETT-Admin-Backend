var winston = require('winston');
// var config = require('./config');
require('dotenv').config()
const path = require('path');
const filename_error = path.join(__dirname, 'logs/file_error.log');
const filename_info = path.join(__dirname, 'logs/file_info.log');

const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: filename_info,
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.prettyPrint()
            )
        }),

        new winston.transports.File({
            filename: filename_error,
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(), 
                winston.format.prettyPrint()
            )
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }
module.exports = logger;


// const {createLogger, transports, format} = require('winston');

// // ---Logging---

// const adminLogger = createLogger({
//     transports:[
//         new transports.File({
//             filename: 'admin.log',
//             level: 'info',
//             format: format.combine(format.timestamp(), format.json())
//         }),
//         new transports.File({
//             filename: 'admin-error.log',
//             level: 'error',
//             format: format.combine(format.timestamp(), format.json())
//         }),
//     ]
// })

// module.exports = {adminLogger};