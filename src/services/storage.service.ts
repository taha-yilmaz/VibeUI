import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrlPrefix: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || '';
    this.publicUrlPrefix = process.env.S3_PUBLIC_URL || '';

    if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  /**
   * Uploads a buffer to S3/R2 and returns the public URL.
   */
  async uploadScreenshot(buffer: Buffer, jobId: string, pageId: string, type: 'desktop' | 'mobile'): Promise<string | null> {
    if (!this.s3Client || !this.bucketName) {
      console.warn('[Storage] S3 client not configured, skipping upload.');
      return null;
    }

    const ext = 'png';
    const key = `screenshots/${jobId}/${pageId}/${type}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      }));

      if (this.publicUrlPrefix) {
        return `${this.publicUrlPrefix}/${key}`;
      }
      
      // If no public URL is provided, return the endpoint + bucket + key path
      // This is a naive fallback and might not work for all S3 providers depending on path style.
      return `${process.env.S3_ENDPOINT}/${this.bucketName}/${key}`;

    } catch (error) {
      console.error('[Storage] Error uploading to S3:', error);
      return null;
    }
  }
}
