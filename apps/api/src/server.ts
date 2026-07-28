import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

export async function startServer(): Promise<http.Server> {
  try {
    // 1. Connect to MongoDB database
    await connectDatabase(env.MONGODB_URI);

    // 2. Start HTTP Server
    const server = http.createServer(app);

    return new Promise((resolve, reject) => {
      server.listen(env.PORT, () => {
        logger.info(
          `🚀 Little Angels School ERP Backend API listening on port ${env.PORT} [${env.NODE_ENV}]`,
        );
        resolve(server);
      });

      server.on('error', (err) => {
        logger.error({ err }, '❌ HTTP server failed to bind/start');
        reject(err);
      });
    });
  } catch (error) {
    logger.error({ error }, '❌ Fatal error during server startup. Shutting down.');
    await disconnectDatabase();
    process.exit(1);
  }
}

// Auto-start only when executed directly (not when required by Vitest or Supertest)
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Fatal startup exception:', error);
    process.exit(1);
  });
}
