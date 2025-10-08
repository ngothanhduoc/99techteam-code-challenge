import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './config/database';
import logger from './config/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      logger.info('=================================');
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
      logger.info('=================================');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

