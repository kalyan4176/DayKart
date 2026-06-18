import s3Client from '../config/s3.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

let isCloudinaryInitialized = false;

export const uploadFile = async (file, folder = 'uploads') => {
  const fileExtension = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueFileName = `${baseName}_${Date.now()}${fileExtension}`;
  const s3Key = `${folder}/${uniqueFileName}`;

  // Configure Cloudinary lazily when the first upload is triggered (after dotenv has run)
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    if (!isCloudinaryInitialized) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      logger.info('Cloudinary SDK Initialized dynamically');
      isCloudinaryInitialized = true;
    }

    try {
      const resultUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: `daykart/${folder}` },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
      logger.info(`Uploaded file successfully to Cloudinary: ${resultUrl}`);
      return resultUrl;
    } catch (err) {
      logger.error(`Cloudinary upload failed: ${err.message}. Falling back...`);
    }
  } else if (!isCloudinaryInitialized) {
    logger.info('Cloudinary not configured. Using S3 or Local storage fallback.');
    isCloudinaryInitialized = true;
  }

  // 2. AWS S3 credentials missing or configured to mock -> Write locally
  if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'mock-key') {
    try {
      const localDir = path.join(process.cwd(), 'public', folder);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      const localPath = path.join(localDir, uniqueFileName);
      fs.writeFileSync(localPath, file.buffer);
      
      // Return absolute URL so frontend can load it from backend
      const port = process.env.PORT || 5005;
      const localUrl = `http://localhost:${port}/public/${folder}/${uniqueFileName}`;
      logger.info(`[Storage Mock] Uploaded file locally to public folder: ${localUrl}`);
      return localUrl;
    } catch (err) {
      logger.error(`Local storage upload mock failed: ${err.message}`);
      throw err;
    }
  }

  // 3. Real S3 Upload
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'daykart-bucket';
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);
    
    const region = process.env.AWS_REGION || 'us-east-1';
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    logger.info(`Uploaded file successfully to AWS S3: ${s3Url}`);
    return s3Url;
  } catch (error) {
    logger.error(`S3 File upload operation failed: ${error.message}`);
    throw error;
  }
};
