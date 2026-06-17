import { S3Client } from '@aws-sdk/client-s3';
import logger from './logger.js';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret',
  },
});

logger.info('AWS S3 Client Initialized');

export default s3Client;
