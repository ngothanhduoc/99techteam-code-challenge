import { Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AuthRequest } from './auth';

// Request logging middleware
export const requestLogger = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      user: req.user ? req.user.email : 'anonymous',
    };

    logger.log(logLevel, `${req.method} ${req.originalUrl}`, logData);
  });

  next();
};

// Log helper functions for controllers
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: any, meta?: any) => {
  logger.error(message, { error: error?.message || error, stack: error?.stack, ...meta });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

