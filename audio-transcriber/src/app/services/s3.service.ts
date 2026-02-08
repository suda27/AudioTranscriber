import { Injectable } from '@angular/core';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { AwsConfigService } from './aws-config.service';

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private s3Client!: S3Client; // Initialized in constructor via initializeS3Client()

  constructor(private awsConfig: AwsConfigService) {
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    const region = this.awsConfig.getRegion();
    
    // Option 1: Using Cognito Identity Pool (Recommended)
    if (this.awsConfig.cognitoIdentityPoolId) {
      this.s3Client = new S3Client({
        region: region,
        credentials: fromCognitoIdentityPool({
          clientConfig: { region: region },
          identityPoolId: this.awsConfig.cognitoIdentityPoolId
        })
      });
    } 
    // Option 2: Direct credentials (Development only)
    else if (this.awsConfig.accessKeyId && this.awsConfig.secretAccessKey) {
      this.s3Client = new S3Client({
        region: region,
        credentials: {
          accessKeyId: this.awsConfig.accessKeyId,
          secretAccessKey: this.awsConfig.secretAccessKey
        }
      });
    } else {
      throw new Error('AWS credentials not configured. Please set up Cognito Identity Pool or provide credentials.');
    }
  }

  async uploadFile(file: File): Promise<string> {
    const bucketName = this.awsConfig.getS3BucketName();
    if (!bucketName) {
      throw new Error('S3 bucket name not configured');
    }

    // Generate a unique key for the file
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const key = `audio-files/${timestamp}-${randomString}.${fileExtension}`;

    try {
      // Convert File to ArrayBuffer for browser compatibility
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: uint8Array, // Use Uint8Array instead of File object
        ContentType: file.type || 'audio/mpeg'
      });

      await this.s3Client.send(command);

      // Return the S3 URI
      return `s3://${bucketName}/${key}`;
    } catch (error: any) {
      console.error('Error uploading file to S3:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        throw new Error(
          'Failed to upload to S3: CORS configuration issue. ' +
          'Please configure CORS on your S3 bucket. See S3_CORS_SETUP.md for instructions. ' +
          `Original error: ${error.message}`
        );
      }
      
      if (error.name === 'AccessDenied' || error.message?.includes('Access Denied')) {
        throw new Error(
          'Access denied: Check IAM role permissions for S3 PutObject. ' +
          'Ensure your Cognito Identity Pool role has s3:PutObject permission.'
        );
      }
      
      throw new Error(`Failed to upload file to S3: ${error.message || error}`);
    }
  }

  async getObject(bucketName: string, key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      // Convert the stream to text
      if (response.Body) {
        // In browser, Body is a ReadableStream
        const stream = response.Body as ReadableStream;
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
          }
        }
        
        // Combine chunks and convert to string
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(result);
      }
      
      throw new Error('No body in S3 response');
    } catch (error: any) {
      console.error('Error getting object from S3:', error);
      throw new Error(`Failed to get object from S3: ${error.message || error}`);
    }
  }

  parseS3Uri(uri: string): { bucket: string; key: string } | null {
    // Handle s3://bucket/key format
    if (uri.startsWith('s3://')) {
      const parts = uri.replace('s3://', '').split('/');
      const bucket = parts[0];
      const key = parts.slice(1).join('/');
      return { bucket, key };
    }
    
    // Handle https://s3.region.amazonaws.com/bucket/key format
    const httpsMatch = uri.match(/https?:\/\/s3[.-]([^.]+)\.amazonaws\.com\/([^\/]+)\/(.+)/);
    if (httpsMatch) {
      return { bucket: httpsMatch[2], key: httpsMatch[3] };
    }
    
    // Handle https://bucket.s3.region.amazonaws.com/key format
    const s3Match = uri.match(/https?:\/\/([^.]+)\.s3[.-]([^.]+)\.amazonaws\.com\/(.+)/);
    if (s3Match) {
      return { bucket: s3Match[1], key: s3Match[3] };
    }
    
    return null;
  }
}

