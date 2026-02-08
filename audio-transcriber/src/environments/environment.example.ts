// Example environment configuration
// Copy this file to environment.ts and environment.prod.ts
// DO NOT commit actual credentials to version control!

export const environment = {
  production: false,
  aws: {
    // Option 1: Cognito Identity Pool (Recommended)
    cognitoIdentityPoolId: 'us-east-1:your-identity-pool-id',
    
    // Option 2: Direct credentials (Development only - NOT RECOMMENDED for production)
    // accessKeyId: 'your-access-key-id',
    // secretAccessKey: 'your-secret-access-key',
    
    region: 'us-east-1',
    s3BucketName: 'your-bucket-name'
  }
};

