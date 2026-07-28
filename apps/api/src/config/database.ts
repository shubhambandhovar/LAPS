import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  const options: mongoose.ConnectOptions = {
    autoIndex: env.NODE_ENV !== 'production',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    mongoose.connection.on('connected', () => {
      logger.info('📦 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, '❌ Mongoose connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    const conn = await mongoose.connect(uri, options);
    logger.info(`✅ Successfully connected to MongoDB database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error({ error }, '❌ Fatal MongoDB connection failure');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('📦 MongoDB connection cleanly closed via graceful shutdown');
  }
}

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}

// Register graceful shutdown handlers
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
