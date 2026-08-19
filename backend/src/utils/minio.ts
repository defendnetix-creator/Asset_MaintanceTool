// backend/src/utils/minio.ts
// MinIO client utility

import { Client as Minio } from 'minio';

export class MinioClient {
  private client: Minio;

  constructor() {
    this.client = new Minio({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      region: process.env.MINIO_REGION || 'us-east-1',
    });
  }

  async ensureBucket(bucketName: string): Promise<void> {
    const exists = await this.client.bucketExists(bucketName);
    if (!exists) {
      await this.client.makeBucket(bucketName, process.env.MINIO_REGION || 'us-east-1');
      // Set bucket policy for versioning
      await this.client.setBucketVersioning(bucketName, { status: 'Enabled' });
    }
  }

  async putObject(bucketName: string, objectName: string, stream: any, metaData?: any): Promise<void> {
    await this.ensureBucket(bucketName);
    await this.client.putObject(bucketName, objectName, stream, metaData);
  }

  async getObject(bucketName: string, objectName: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(bucketName, objectName);
  }

  async removeObject(bucketName: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucketName, objectName);
  }

  async listObjects(bucketName: string, prefix: string = '', recursive: boolean = true): Promise<string[]> {
    const objects: string[] = [];
    const stream = this.client.listObjects(bucketName, prefix, recursive);
    for await (const obj of stream) {
      if (obj.name) objects.push(obj.name);
    }
    return objects;
  }

  async presignedGetObject(bucketName: string, objectName: string, expirySeconds: number = 900): Promise<string> {
    return this.client.presignedGetObject(bucketName, objectName, expirySeconds);
  }

  async presignedPutObject(bucketName: string, objectName: string, expirySeconds: number = 900): Promise<string> {
    return this.client.presignedPutObject(bucketName, objectName, expirySeconds);
  }

  async getObjectInfo(bucketName: string, objectName: string): Promise<any> {
    return this.client.statObject(bucketName, objectName);
  }

  async copyObject(bucketName: string, sourceObject: string, destObject: string): Promise<void> {
    await this.client.copyObject(bucketName, destObject, `/${bucketName}/${sourceObject}`);
  }

  async removeObjects(bucketName: string, objectNames: string[]): Promise<void> {
    await this.client.removeObjects(bucketName, objectNames);
  }

  async listBuckets(): Promise<string[]> {
    const buckets = await this.client.listBuckets();
    return buckets.map(b => b.name);
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    return this.client.bucketExists(bucketName);
  }

  getClient(): Minio {
    return this.client;
  }
}

// Singleton instance
let minioInstance: MinioClient | null = null;

export function getMinioClient(): MinioClient {
  if (!minioInstance) {
    minioInstance = new MinioClient();
  }
  return minioInstance;
}