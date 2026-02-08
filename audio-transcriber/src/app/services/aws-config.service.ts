import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AwsConfigService {
  // AWS Configuration
  // Using Cognito Identity Pool (Option 1 - Recommended)
  // 
  // IMPORTANT: This is NOT a User Pool ID - you need an Identity Pool!
  // - User Pool: For authentication (sign up/sign in)
  // - Identity Pool: For temporary AWS credentials (what we need here)
  //
  // Format: region:identity-pool-id
  // The identity-pool-id must be hexadecimal (0-9, a-f) and can include hyphens
  // Example: 'ap-south-1:12345678-1234-1234-1234-123456789012'
  //
  // To create/find your Identity Pool ID:
  // 1. Go to AWS Cognito Console > Identity Pools (NOT "User pools")
  // 2. Create a new Identity Pool or select existing one
  // 3. Enable "Unauthenticated access"
  // 4. Copy the "Identity pool ID" (format: region:hex-id)
  // 5. Make sure the IAM role has S3 and Transcribe permissions
  //
  // See CREATE_IDENTITY_POOL.md for detailed instructions
  cognitoIdentityPoolId: string = 'ap-south-1:ef400bf4-247c-4635-9f15-bf276323de07';
  region: string = 'ap-south-1';
  
  // Option 2: Direct credentials (NOT RECOMMENDED for production)
  // Only use for development/testing
  accessKeyId: string = '';
  secretAccessKey: string = '';
  
  // S3 Configuration
  s3BucketName: string = 'kani-audio'; // Bucket for audio file uploads
  transcriptionBucketName: string = 'kani-audio-transcription'; // Bucket for transcription outputs
  
  constructor() { }
  
  getRegion(): string {
    return this.region;
  }
  
  getS3BucketName(): string {
    return this.s3BucketName;
  }
  
  getTranscriptionBucketName(): string {
    return this.transcriptionBucketName;
  }
}

