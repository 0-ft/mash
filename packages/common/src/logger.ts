import winston from "winston";

export const logger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: 'mash-debug.log'}),
        new winston.transports.File({ filename: 'mash-error.log' , level: "error"})
    ]
});

// if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
// }
